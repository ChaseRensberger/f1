package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"f1-server/auth"
	"f1-server/cache"
	"f1-server/client"
	"f1-server/handler"
	"f1-server/realtime"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../.env.local")

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	c := client.New()
	ca := cache.New()
	proxy := handler.NewProxy(c, ca)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	endpoints := []string{
		"meetings",
		"sessions",
		"championship_drivers",
		"championship_teams",
		"drivers",
	}
	for _, ep := range endpoints {
		r.Get("/v1/"+ep, proxy.Handle(ep))
	}

	username := os.Getenv("OPENF1_USERNAME")
	password := os.Getenv("OPENF1_PASSWORD")

	if username != "" && password != "" && username != "your_username_here" {
		tm, err := auth.NewTokenManager(username, password)
		if err != nil {
			log.Printf("auth: failed to obtain token: %v (realtime features disabled)", err)
		} else {
			defer tm.Stop()

			c.SetTokenSource(tm)

			var broker *handler.SSEBroker
			rt := realtime.NewClient(tm, func(snapshot realtime.SessionSnapshot) {
				if broker != nil {
					broker.Broadcast(snapshot)
				}
			})
			broker = handler.NewSSEBroker(rt)

			rt.Start()
			defer rt.Stop()

			r.Get("/v1/session/live", broker.Handle())
			log.Println("realtime: SSE endpoint available at /v1/session/live")
		}
	} else {
		log.Println("realtime: OPENF1_USERNAME/OPENF1_PASSWORD not set, realtime features disabled")
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		log.Printf("server listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
	log.Println("server stopped")
}
