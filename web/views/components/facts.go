package components

import (
	"cmp"

	"workshop/internal/domain/species"
)

// funFacts holds one field note per species, keyed by canonical name.
var funFacts = map[string]string{
	"Spheniscus demersus":        "Brays like a donkey, which earned it the old name \"jackass penguin\".",
	"Syncerus caffer":            "Herds vote on where to graze: resting cows stand and face the direction they prefer.",
	"Loxodonta africana":         "The largest land animal alive; its ears work as radiators to shed heat.",
	"Lycaon pictus":              "Pack members sneeze to vote on whether to set off on a hunt.",
	"Inia geoffrensis":           "Turns pinker with age and excitement, and its neck bends because the vertebrae aren't fused.",
	"Alligator mississippiensis": "Nest temperature decides a hatchling's sex: warm nests make males.",
	"Bison bison":                "North America's heaviest land mammal, yet it can sprint at 55 km/h.",
	"Crocodylus acutus":          "Tolerates salt water well enough to colonise Caribbean islands.",
	"Elephas maximus":            "Its trunk holds tens of thousands of muscles and can pick up a single grain.",
	"Fratercula arctica":         "Can carry over a dozen fish crosswise in its beak at once.",
	"Haliaeetus leucocephalus":   "Builds the largest tree nests of any North American bird, some over a tonne.",
	"Pongo pygmaeus":             "Spends most of its life in the trees and builds a fresh sleeping nest every night.",
	"Aptenodytes forsteri":       "Males fast for about two months, balancing the egg on their feet through the Antarctic winter.",
	"Pygoscelis papua":           "The fastest-swimming penguin, reaching about 36 km/h underwater.",
	"Gavialis gangeticus":        "Males grow a bulbous knob, the ghara, on the snout to buzz underwater calls.",
	"Phoenicopterus roseus":      "Its pink comes from carotenoid pigments in the shrimp and algae it filters.",
	"Equus grevyi":               "The largest wild equid, with the narrowest stripes of any zebra.",
	"Choloepus hoffmanni":        "So slow that algae grow in its fur, tinting it green as camouflage.",
	"Rhinoceros unicornis":       "Its armour-plated look is just skin folds; it's a strong swimmer too.",
	"Aptenodytes patagonicus":    "Raising one chick takes over a year, so pairs breed at most twice in three years.",
	"Varanus komodoensis":        "The world's largest lizard; females can lay fertile eggs without a mate.",
	"Dermochelys coriacea":       "The largest turtle: dives below 1,000 m and crosses whole oceans chasing jellyfish.",
	"Giraffa tippelskirchi":      "Recognisable by jagged, star-shaped patches, like vine leaves.",
	"Crocodylus niloticus":       "Carries its hatchlings to the water gently in its jaws.",
	"Ornithorhynchus anatinus":   "Lays eggs, senses prey by electroreception, and males carry venomous ankle spurs.",
	"Lemur catta":                "Males hold \"stink fights\", wafting scented tails at rivals.",
	"Grampus griseus":            "Adults are covered in white scars, mostly from squid and each other.",
	"Ara macao":                  "Eats clay from riverbanks, thought to neutralise toxins in seeds.",
	"Balaeniceps rex":            "Stands motionless for hours, then lunges and snaps up lungfish whole.",
	"Bubo scandiacus":            "Hunts by day in the Arctic summer, when the sun never sets.",
	"Giraffa giraffa":            "A giraffe's neck has just seven vertebrae, the same as yours, each up to 25 cm long.",
	"Stenella longirostris":      "Leaps and spins up to seven times in a single jump.",
	"Pongo abelii":               "Uses sticks as tools, and leaves as umbrellas when it rains.",
	"Rhincodon typus":            "The largest fish in the sea, yet it feeds on plankton; each one's spots are unique.",
	"Delphinapterus leucas":      "The \"canary of the sea\": a flexible melon lets it change its face and its calls.",
	"Diceros bicornis":           "Its hooked upper lip works like a finger to pluck twigs.",
	"Connochaetes gnou":          "The white-tailed gnu snorts and gallops in circles when alarmed.",
	"Balaenoptera musculus":      "The largest animal ever known; its heart is the size of a small car.",
	"Connochaetes taurinus":      "Over a million make the Serengeti–Mara migration every year.",
	"Balaena mysticetus":         "May live more than 200 years, the longest of any mammal.",
	"Ursus arctos":               "Can smell food from kilometres away; its nose beats a bloodhound's.",
	"Bradypus variegatus":        "Climbs down only about once a week, and can turn its head 270°.",
	"Hydrochoerus hydrochaeris":  "The world's largest rodent, and it can hold its breath for five minutes.",
	"Acinonyx jubatus":           "Hits 100 km/h in about three seconds, but can't roar: it chirps.",
	"Pan troglodytes":            "Shares about 98.8% of our DNA, and fishes for termites with stripped twigs.",
	"Tursiops truncatus":         "Each one has a signature whistle that works like a name.",
	"Phacochoerus africanus":     "Kneels on padded wrists to graze, and backs into burrows tusks first.",
	"Vombatus ursinus":           "Produces cube-shaped droppings, used to mark territory.",
	"Balaenoptera physalus":      "The \"greyhound of the sea\", and the only animal with asymmetrically coloured jaws.",
	"Giraffa camelopardalis":     "Its tongue is about 50 cm long and dark, perhaps to avoid sunburn.",
	"Eschrichtius robustus":      "Makes one of the longest migrations of any mammal, around 20,000 km a year.",
	"Carcharodon carcharias":     "Senses the faint electric fields of prey through gel-filled pores on its snout.",
	"Chelonia mydas":             "Named for the green colour of its fat, from a diet of seagrass.",
	"Phoca vitulina":             "Its whiskers can track the wake of a fish that passed half a minute earlier.",
	"Hippopotamus amphibius":     "Secretes a reddish \"blood sweat\" that works as sunscreen.",
	"Megaptera novaeangliae":     "Males sing complex songs that spread across whole ocean basins.",
	"Aepyceros melampus":         "Leaps 10 m long and 3 m high, often just to confuse predators.",
	"Panthera onca":              "Has the strongest bite of any big cat for its size, cracking turtle shells.",
	"Phascolarctos cinereus":     "Sleeps up to 20 hours a day to save energy on a poor eucalyptus diet.",
	"Panthera pardus":            "Hauls kills heavier than itself up into trees to keep them from lions.",
	"Hydrurga leptonyx":          "An apex predator of Antarctica with a reptile-like head and huge gape.",
	"Panthera leo":               "A roar can carry 8 km across the savannah.",
	"Balaenoptera acutorostrata": "The smallest rorqual, and among the most curious towards boats.",
	"Alces alces":                "Can dive nearly 6 m to graze on water plants.",
	"Equus zebra":                "Has a small dewlap on its throat, which other zebras lack.",
	"Orcinus orca":               "Each pod has its own dialect, and grandmothers lead the hunt.",
	"Equus quagga":               "No two zebras share the same stripe pattern.",
	"Ursus maritimus":            "Its skin is black and its fur is see-through, not white.",
	"Puma concolor":              "Holds the record for the most names of any animal: cougar, mountain lion, panther…",
	"Macropus rufus":             "Bounds 8 m in a single hop, and its tail acts as a fifth leg.",
	"Crocodylus porosus":         "The largest living reptile, recorded swimming far out at sea.",
	"Enhydra lutris":             "Holds hands with others while sleeping so it doesn't drift away.",
	"Delphinus delphis":          "Gathers in superpods of thousands that churn the sea white.",
	"Physeter macrocephalus":     "Has the largest brain of any animal, and dives beyond 2 km for squid.",
	"Crocuta crocuta":            "Clans are led by females, and its \"laugh\" signals frustration.",
	"Panthera tigris":            "The largest cat; its stripes are on its skin, not just its fur.",
	"Odobenus rosmarus":          "Uses its tusks to haul itself out onto ice.",
	"Ceratotherium simum":        "The second-largest land mammal; its wide lip is for grazing.",
}

// classFacts is the fallback when a species has no note of its own.
var classFacts = map[string]string{
	"Mammalia":       "Mammals are the only animals with hair, and all of them feed their young on milk.",
	"Aves":           "Birds are living dinosaurs, descended from the theropods.",
	"Crocodylia":     "Crocodilians have barely changed in over 80 million years.",
	"Elasmobranchii": "Sharks have skeletons of cartilage and keep regrowing teeth all their lives.",
	"Squamata":       "Lizards and snakes smell with their tongues.",
	"Testudines":     "Turtles have existed for more than 200 million years.",
}

// FunFact returns a field note for the species, falling back to its class.
func FunFact(sp species.Species) string {
	return cmp.Or(funFacts[sp.CanonicalName], classFacts[sp.Class], "No field notes logged for this specimen yet.")
}
