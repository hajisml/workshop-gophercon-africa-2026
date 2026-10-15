package components

import (
	"cmp"
	"fmt"
	"net/url"
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
		"data-id":      s.ID.String(),
		"data-animal":  Animal(s),
		"data-group":   Group(s),
		"data-country": Country(s),
		"data-search": strings.ToLower(strings.Join([]string{
			Animal(s), s.Species.ScientificName, place(s.Location), s.RecordedBy,
		}, " ")),
	}
}

// SpecimenURL is the address of the sighting's own page.
func SpecimenURL(s sighting.Sighting) templ.SafeURL {
	return templ.URL("/specimens/" + s.ID.String())
}

// TrackerURL opens the tracker locked on to the sighting's animal.
func TrackerURL(animal string) templ.SafeURL {
	return templ.URL("/tracker?animal=" + url.QueryEscape(animal))
}

// TrackPoint is what the tracker needs of one sighting.
type TrackPoint struct {
	ID       string  `json:"id"`
	Animal   string  `json:"animal"`
	Country  string  `json:"country"`
	Place    string  `json:"place"`
	Observer string  `json:"observer"`
	Time     int64   `json:"time"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
}

// TrackPoints turns sightings into the tracker's data.
func TrackPoints(sightings []sighting.Sighting) []TrackPoint {
	points := make([]TrackPoint, len(sightings))
	for i, s := range sightings {
		points[i] = TrackPoint{
			ID: s.ID.String(), Animal: Animal(s), Country: Country(s), Place: place(s.Location),
			Observer: s.RecordedBy, Time: s.HappenedAt.Unix(), Lat: s.Location.Latitude, Lng: s.Location.Longitude,
		}
	}
	return points
}

// Photos returns the sighting's still images.
func Photos(s sighting.Sighting) []sighting.Media {
	return slices.DeleteFunc(slices.Clone(s.Media), func(m sighting.Media) bool { return m.Type != "StillImage" || m.URL == "" })
}

// SameAnimal returns up to n other sightings of the same species, newest first.
func SameAnimal(s sighting.Sighting, all []sighting.Sighting, n int) []sighting.Sighting {
	others := slices.DeleteFunc(slices.Clone(all), func(o sighting.Sighting) bool {
		return o.ID == s.ID || o.Species.ScientificName != s.Species.ScientificName
	})
	return Latest(others, n)
}

// Rank is one level of the taxonomy tree.
type Rank struct{ Level, Name string }

// Lineage lists the ranks GBIF supplied, kingdom first.
func Lineage(sp species.Species) []Rank {
	ranks := []Rank{
		{"Kingdom", sp.Kingdom}, {"Phylum", sp.Phylum}, {"Class", sp.Class}, {"Order", sp.Order},
		{"Family", sp.Family}, {"Genus", sp.Genus}, {"Species", cmp.Or(sp.CanonicalName, sp.Species)},
	}
	return slices.DeleteFunc(ranks, func(r Rank) bool { return r.Name == "" })
}

// Basis puts GBIF's basis of record into words.
func Basis(b string) string {
	return cmp.Or(strings.ToLower(strings.ReplaceAll(b, "_", " ")), "not recorded")
}

// Metres renders an optional measurement in metres.
func Metres(v *float64) string {
	if v == nil {
		return "–"
	}
	return strconv.FormatFloat(*v, 'f', 0, 64) + " m"
}

// SpecimenCode is a short catalogue number from the GBIF key.
func SpecimenCode(s sighting.Sighting) string { return specimenCode(s) }

// Coords formats a position as degrees with hemispheres.
func Coords(c sighting.Coordinates) string { return coords(c) }

// LoggedAt is when it was seen, with the time only when GBIF recorded one.
func LoggedAt(t time.Time) string { return loggedAt(t) }

// Place joins whichever parts of the location GBIF supplied.
func Place(l sighting.Location) string { return place(l) }

// Individuals renders how many animals were seen.
func Individuals(n int) string { return individuals(n) }

// PhotoAlt describes a photo for screen readers.
func PhotoAlt(s sighting.Sighting, m sighting.Media) string { return photoAlt(s, m) }

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
