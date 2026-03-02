package handler

import (
	"net/http"
	"sort"
	"strings"
	"time"

	"f1-server/cache"
	"f1-server/client"
)

type Proxy struct {
	client *client.Client
	cache  *cache.Cache
	ttls   map[string]time.Duration
}

func NewProxy(c *client.Client, ca *cache.Cache) *Proxy {
	return &Proxy{
		client: c,
		cache:  ca,
		ttls: map[string]time.Duration{
			"meetings":             1 * time.Hour,
			"sessions":             10 * time.Minute,
			"championship_drivers": 5 * time.Minute,
			"championship_teams":   5 * time.Minute,
			"drivers":              5 * time.Minute,
		},
	}
}

func (p *Proxy) Handle(endpoint string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		cacheKey := buildCacheKey(endpoint, query)

		if data, ok := p.cache.Get(cacheKey); ok {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			w.Write(data)
			return
		}

		body, status, err := p.client.Fetch(endpoint, query)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}

		if status != http.StatusOK {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(status)
			w.Write(body)
			return
		}

		ttl := p.ttls[endpoint]
		if ttl == 0 {
			ttl = 5 * time.Minute
		}
		p.cache.Set(cacheKey, body, ttl)

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "MISS")
		w.Write(body)
	}
}

func buildCacheKey(endpoint string, query map[string][]string) string {
	keys := make([]string, 0, len(query))
	for k := range query {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var b strings.Builder
	b.WriteString(endpoint)
	for _, k := range keys {
		vals := query[k]
		sort.Strings(vals)
		for _, v := range vals {
			b.WriteByte('|')
			b.WriteString(k)
			b.WriteByte('=')
			b.WriteString(v)
		}
	}
	return b.String()
}
