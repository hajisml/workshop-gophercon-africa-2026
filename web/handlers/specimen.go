package handlers

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"uuid"
	"workshop/internal/domain/sighting"
	"workshop/web/views/pages"
)

type SpecimenFinder interface {
	Find(ctx context.Context, id uuid.UUID) (sighting.Sighting, error)
	SightingsLister
}

func Specimen(logger *slog.Logger, sightings SpecimenFinder) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		id, err := uuid.Parse(r.PathValue("id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}

		s, err := sightings.Find(ctx, id)
		if errors.Is(err, sighting.ErrNotFound) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			logger.ErrorContext(ctx, "handlers: finding sighting: "+err.Error())
			renderError(ctx, w, logger, http.StatusInternalServerError, "Unable to load this specimen.")
			return
		}

		all, err := sightings.List(ctx, sighting.ListFilter{})
		if err != nil {
			logger.ErrorContext(ctx, "handlers: listing sightings: "+err.Error())
			renderError(ctx, w, logger, http.StatusInternalServerError, "Unable to load this specimen.")
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err = pages.Specimen(s, all).Render(ctx, w); err != nil {
			logger.ErrorContext(ctx, "handlers: rendering specimen: "+err.Error())
		}
	}
}
