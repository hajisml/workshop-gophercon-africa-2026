package handlers

import (
	"log/slog"
	"net/http"
	"workshop/internal/domain/sighting"

	"github.com/a-h/templ"
)

// listPage serves a page built from every sighting.
func listPage(logger *slog.Logger, sightings SightingsLister, page func(r *http.Request, items []sighting.Sighting) templ.Component) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		items, err := sightings.List(ctx, sighting.ListFilter{})
		if err != nil {
			logger.ErrorContext(ctx, "handlers: listing sightings: "+err.Error())
			renderError(ctx, w, logger, http.StatusInternalServerError, "Unable to load sightings.")
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err = page(r, items).Render(ctx, w); err != nil {
			logger.ErrorContext(ctx, "handlers: rendering page: "+err.Error())
		}
	}
}
