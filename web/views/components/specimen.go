package components

import (
	"cmp"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/a-h/templ"

	"workshop/internal/domain/sighting"
	"workshop/internal/domain/species"
)

// Animal names the animal seen, as the card does.
func Animal(s sighting.Sighting) string { return displayName(s.Species) }

// Country is where it was seen.
func Country(s sighting.Sighting) string { return s.Location.Country }

// Group is the plain name of the animal's class.
func Group(s sighting.Sighting) string {
	switch s.Species.Class {
	case "Mammalia":
		return "Mammals"
	case "Aves":
		return "Birds"
	case "Crocodylia":
		return "Crocodilians"
	case "Elasmobranchii":
		return "Sharks"
	case "Squamata":
		return "Lizards"
	case "Testudines":
		return "Turtles"
	}
	return s.Species.Class
}

// Observer names who logged the sighting.
func Observer(s sighting.Sighting) string { return s.RecordedBy }

// FilterOptions counts how often each key appears, keeping the n most common; 0 keeps all.
func FilterOptions(sightings []sighting.Sighting, n int, key func(sighting.Sighting) string) []sighting.Tally {
	return sighting.Top(sighting.CountBy(sightings, key), n)
}

// FilterAttrs marks a list item with what the filter and the tracker read.
func FilterAttrs(s sighting.Sighting) templ.Attributes {
	return templ.Attributes{
		"data-id":       s.ID.String(),
		"data-animal":   Animal(s),
		"data-group":    Group(s),
		"data-country":  Country(s),
		"data-place":    place(s.Location),
		"data-observer": s.RecordedBy,
		"data-time":     strconv.FormatInt(s.HappenedAt.Unix(), 10),
		"data-search": strings.ToLower(strings.Join([]string{
			Animal(s), s.Species.ScientificName, place(s.Location), s.RecordedBy,
		}, " ")),
	}
}

// SpecimenID is the card's element id, which the globe links to.
func SpecimenID(s sighting.Sighting) string { return "s-" + s.ID.String() }

// GlobePoints is each sighting as [lat, lng], in the order of the cards.
func GlobePoints(sightings []sighting.Sighting) [][2]float64 {
	points := make([][2]float64, len(sightings))
	for i, s := range sightings {
		points[i] = [2]float64{s.Location.Latitude, s.Location.Longitude}
	}
	return points
}

// firstPhoto returns the sighting's first still image, if it has one.
func firstPhoto(s sighting.Sighting) (sighting.Media, bool) {
	i := slices.IndexFunc(s.Media, func(m sighting.Media) bool { return m.Type == "StillImage" && m.URL != "" })
	if i < 0 {
		return sighting.Media{}, false
	}
	return s.Media[i], true
}

// taxonomy joins the class, order and family that GBIF supplied.
func taxonomy(s sighting.Sighting) string {
	parts := slices.DeleteFunc(
		[]string{s.Species.Class, s.Species.Order, s.Species.Family},
		func(p string) bool { return p == "" },
	)
	return strings.Join(parts, " › ")
}

// coords formats a position as degrees with hemispheres.
func coords(c sighting.Coordinates) string {
	ns, ew := "N", "E"
	if c.Latitude < 0 {
		ns = "S"
	}
	if c.Longitude < 0 {
		ew = "W"
	}
	return fmt.Sprintf("%.3f°%s %.3f°%s", abs(c.Latitude), ns, abs(c.Longitude), ew)
}

func abs(f float64) float64 {
	if f < 0 {
		return -f
	}
	return f
}

// loggedAt is when it was seen, with the time only when GBIF recorded one.
func loggedAt(t time.Time) string {
	t = t.UTC()
	if t.Hour() == 0 && t.Minute() == 0 && t.Second() == 0 {
		return t.Format("2 Jan 2006")
	}
	return t.Format("15:04 UTC · 2 Jan 2006")
}

// specimenCode is a short catalogue number from the GBIF key.
func specimenCode(s sighting.Sighting) string {
	return fmt.Sprintf("SPC-%d", s.GBIFKey)
}

// photoAlt describes a photo for screen readers.
func photoAlt(s sighting.Sighting, m sighting.Media) string {
	return cmp.Or(m.Title, m.Description, "Photo of a "+displayName(s.Species))
}

// Latest returns the n most recent sightings, newest first.
func Latest(sightings []sighting.Sighting, n int) []sighting.Sighting {
	sorted := slices.Clone(sightings)
	slices.SortFunc(sorted, func(a, b sighting.Sighting) int { return b.HappenedAt.Compare(a.HappenedAt) })
	return sorted[:min(n, len(sorted))]
}

// displayName prefers the name a reader would recognise, falling back through the taxonomy.
func displayName(sp species.Species) string {
	return cmp.Or(sp.VernacularName, sp.CanonicalName, sp.ScientificName, "Unknown species")
}

// place joins whichever parts of the location GBIF supplied.
func place(l sighting.Location) string {
	parts := slices.DeleteFunc(
		[]string{l.Locality, l.StateProvince, l.Country},
		func(s string) bool { return s == "" },
	)
	return cmp.Or(strings.Join(parts, ", "), "Location unknown")
}

// individuals renders how many animals were seen in a single sighting.
func individuals(n int) string {
	if n == 1 {
		return "1 individual"
	}
	return fmt.Sprintf("%d individuals", n)
}
