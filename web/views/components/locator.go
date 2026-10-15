package components

import (
	"strconv"

	"workshop/internal/domain/sighting"
)

// locate projects a position onto the locator's 360×180 box.
func locate(c sighting.Coordinates) (x, y string) {
	return strconv.FormatFloat(c.Longitude+180, 'f', 2, 64), strconv.FormatFloat(90-c.Latitude, 'f', 2, 64)
}

// graticule is the locator's grid, every 30°, as x1, y1, x2, y2.
func graticule() [][4]string {
	var lines [][4]string
	for x := 30; x < 360; x += 30 {
		v := strconv.Itoa(x)
		lines = append(lines, [4]string{v, "0", v, "180"})
	}
	for y := 30; y < 180; y += 30 {
		v := strconv.Itoa(y)
		lines = append(lines, [4]string{"0", v, "360", v})
	}
	return lines
}
