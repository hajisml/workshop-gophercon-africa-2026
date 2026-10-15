package components

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"workshop/internal/domain/sighting"
)

// The sparkline's drawing box, matching the viewBox in the templ.
const sparkW, sparkH = 100.0, 24.0

// SparkSince is the first year the activity chart shows; earlier records are too sparse to plot.
const SparkSince = 2010

// years lists every year from the chart's start to the last sighting, so a quiet year stays a dip.
func years(sum sighting.Summary) []int {
	first := max(sum.Earliest.Year(), SparkSince)
	ys := make([]int, 0, max(sum.Latest.Year()-first+1, 0))
	for y := first; y <= sum.Latest.Year(); y++ {
		ys = append(ys, y)
	}
	return ys
}

// peak finds the busiest year and its count.
func peak(byYear map[int]int) (year, count int) {
	for y, n := range byYear {
		if n > count || (n == count && y < year) {
			year, count = y, n
		}
	}
	return year, count
}

// sparkPoints plots a count per year across the box, the busiest year at the top.
func sparkPoints(byYear map[int]int, sum sighting.Summary) string {
	ys := years(sum)
	_, high := peak(byYear)
	var b strings.Builder
	for i, y := range ys {
		x := 0.0
		if len(ys) > 1 {
			x = float64(i) / float64(len(ys)-1) * sparkW
		}
		top := sparkH
		if high > 0 {
			top = sparkH - float64(byYear[y])/float64(high)*(sparkH-1)
		}
		fmt.Fprintf(&b, "%.1f,%.1f ", x, top)
	}
	return strings.TrimSpace(b.String())
}

// sparkArea closes the line down to the baseline, for the fill under it.
func sparkArea(byYear map[int]int, sum sighting.Summary) string {
	return fmt.Sprintf("0,%v %s %v,%v", sparkH, sparkPoints(byYear, sum), sparkW, sparkH)
}

// sparkLabel says in words what the line shows.
func sparkLabel(byYear map[int]int, sum sighting.Summary) string {
	y, n := peak(byYear)
	return fmt.Sprintf("Sightings per year, %d to %d, most in %d with %d",
		max(sum.Earliest.Year(), SparkSince), sum.Latest.Year(), y, n)
}

// SparkFirst is the first year on the activity chart.
func SparkFirst(sum sighting.Summary) int { return max(sum.Earliest.Year(), SparkSince) }

// PeakYear is the busiest year and how many sightings it had.
func PeakYear(byYear map[int]int) (int, int) { return peak(byYear) }

// bar sets --bar to a row's share of the longest, for charts.css to draw.
func bar(count, longest int) map[string]string {
	if longest <= 0 {
		return map[string]string{"--bar": "0%"}
	}
	return map[string]string{"--bar": strconv.Itoa(count*100/longest) + "%"}
}

// Recent counts the sightings in the last year before the latest one.
func Recent(sightings []sighting.Sighting, sum sighting.Summary) int {
	from := sum.Latest.Add(-365 * 24 * time.Hour)
	n := 0
	for _, s := range sightings {
		if s.HappenedAt.After(from) {
			n++
		}
	}
	return n
}
