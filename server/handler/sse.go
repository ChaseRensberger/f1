package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"f1-server/realtime"
)

type SSEBroker struct {
	mu      sync.RWMutex
	clients map[chan []byte]struct{}
	rt      *realtime.Client
}

func NewSSEBroker(rt *realtime.Client) *SSEBroker {
	return &SSEBroker{
		clients: make(map[chan []byte]struct{}),
		rt:      rt,
	}
}

func (b *SSEBroker) Broadcast(snapshot realtime.SessionSnapshot) {
	data, err := json.Marshal(snapshot)
	if err != nil {
		log.Printf("sse: marshal error: %v", err)
		return
	}

	b.mu.RLock()
	defer b.mu.RUnlock()

	for ch := range b.clients {
		select {
		case ch <- data:
		default:
		}
	}
}

func (b *SSEBroker) Handle() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "SSE not supported", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		ch := make(chan []byte, 32)

		b.mu.Lock()
		b.clients[ch] = struct{}{}
		b.mu.Unlock()

		defer func() {
			b.mu.Lock()
			delete(b.clients, ch)
			b.mu.Unlock()
			close(ch)
		}()

		snapshot := b.rt.GetSnapshot()
		initial, err := json.Marshal(snapshot)
		if err == nil {
			fmt.Fprintf(w, "event: session\ndata: %s\n\n", initial)
			flusher.Flush()
		}

		for {
			select {
			case data := <-ch:
				fmt.Fprintf(w, "event: session\ndata: %s\n\n", data)
				flusher.Flush()
			case <-r.Context().Done():
				return
			}
		}
	}
}
