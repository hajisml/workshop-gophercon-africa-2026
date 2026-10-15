package handlers

import (
	"log/slog"
	"net/http"
	"workshop/internal/domain/sighting"
	"workshop/web/views/pages"

	"github.com/a-h/templ"
)

// Tracker serves the wildlife tracker, locked on to ?animal= when given.
func Tracker(logger *slog.Logger, sightings SightingsLister) http.HandlerFunc {
	return listPage(logger, sightings, func(r *http.Request, items []sighting.Sighting) templ.Component {
		return pages.Tracker(items, r.URL.Query().Get("animal"))
	})
}

// Analysis serves the activity dashboard.
func Analysis(logger *slog.Logger, sightings SightingsLister) http.HandlerFunc {
	return listPage(logger, sightings, func(_ *http.Request, items []sighting.Sighting) templ.Component {
		return pages.Analysis(items)
	})
}

// Observers serves the observer credits.
func Observers(logger *slog.Logger, sightings SightingsLister) http.HandlerFunc {
	return listPage(logger, sightings, func(_ *http.Request, items []sighting.Sighting) templ.Component {
		return pages.Observers(items)
	})
}
