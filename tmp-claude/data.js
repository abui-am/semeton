// PetaTrip mock data — 4-day Bali itinerary, foodie + spiritual vibe, base Ubud
// Day colors match design system; coordinates are real-ish Bali locations.

var DAY_COLORS = ["#E8642A", "#2A8B8B", "#7A5AC0", "#D9477F", "#4F8B3F", "#C28A2C", "#5B6FB8"];

var ITINERARY = {
  tripTitle: "4 Days in Bali — Foodie & Spiritual",
  summary: "Stays in Ubud and the east, then dips south for one beach day. No pointless zig-zags through Denpasar traffic.",
  days: [
    {
      dayNumber: 1,
      title: "Ubud Center — Temples & Warungs",
      area: "Ubud",
      theme: "Cultural & Spiritual",
      color: DAY_COLORS[0],
      stops: [
        {
          id: "monkey-forest",
          name: "Sacred Monkey Forest",
          category: "Nature & Culture",
          lat: -8.5188, lng: 115.2587,
          duration: "1.5h",
          bestTime: "8:00–9:30 AM",
          description: "Lush sanctuary with three temples and ~700 macaques.",
          localTip: "Go at opening. By 10am the monkeys are aggressive about food and tour buses arrive in waves.",
          why: "Sets the tone — a quiet, mossy intro to Ubud before the heat hits.",
          travelToNextMin: 9
        },
        {
          id: "warung-bu-mangku",
          name: "Warung Bu Mangku",
          category: "Food · Local",
          lat: -8.4972, lng: 115.2461,
          duration: "1h",
          bestTime: "12:00–14:00",
          description: "Bebek betutu (slow-cooked duck) wrapped in banana leaf.",
          localTip: "Skip the famous bebek spot down the road — 90 min line. This is the chef's cousin, same recipe, half the wait.",
          why: "The duck the locals queue for, without the 90-min queue.",
          travelToNextMin: 14
        },
        {
          id: "saraswati-temple",
          name: "Saraswati Temple",
          category: "Temple",
          lat: -8.5067, lng: 115.2625,
          duration: "45m",
          bestTime: "16:30–17:30",
          description: "Lotus pond temple in central Ubud, free entry.",
          localTip: "Sit at the cafe behind it (Lotus Cafe) — same view, no crowd, and they water-mist the tables.",
          why: "Best golden hour in town, and it's tucked behind a Starbucks most tourists walk past.",
          travelToNextMin: 6
        },
        {
          id: "naughty-nuri",
          name: "Naughty Nuri's",
          category: "Food · Drinks",
          lat: -8.5103, lng: 115.2622,
          duration: "2h",
          bestTime: "18:30–20:30",
          description: "Smoky pork ribs and martinis Anthony Bourdain made famous.",
          localTip: "Order the ribs medium, not 'falling off the bone' — texture's better. Skip the second martini.",
          why: "Touristy on paper, but the ribs really are that good. Honest exception.",
          travelToNextMin: null
        }
      ]
    },
    {
      dayNumber: 2,
      title: "Tegallalang & Eastern Ridge",
      area: "Tegallalang / Tirta Empul",
      theme: "Rice Terraces & Ritual",
      color: DAY_COLORS[1],
      stops: [
        {
          id: "tegallalang",
          name: "Tegallalang Rice Terraces",
          category: "Nature",
          lat: -8.4318, lng: 115.2776,
          duration: "1.5h",
          bestTime: "7:00–8:30 AM",
          description: "Iconic stepped emerald terraces north of Ubud.",
          localTip: "Park at the south end and walk in — the north entrance charges 50k IDR. Same view, same farmers.",
          why: "If you only do one rice terrace, this is the one. Get there before the swing crowds.",
          travelToNextMin: 22
        },
        {
          id: "tirta-empul",
          name: "Tirta Empul Water Temple",
          category: "Temple · Ritual",
          lat: -8.4156, lng: 115.3147,
          duration: "1.5h",
          bestTime: "10:00–11:30 AM",
          description: "Sacred spring temple where Balinese perform melukat purification.",
          localTip: "Bring a sarong from your hotel — the rented ones are damp. Enter the bath wearing the sarong; remove only your shirt.",
          why: "Actual ritual, not a photo op. A guide at the entrance explains the order of the spouts — tip 50k.",
          travelToNextMin: 18
        },
        {
          id: "warung-d-sawah",
          name: "Warung D'Sawah",
          category: "Food · View",
          lat: -8.4252, lng: 115.2802,
          duration: "1h",
          bestTime: "13:00–14:30",
          description: "Open-air warung over the terraces, run by the family that farms the field.",
          localTip: "Order nasi campur and the lawar. Skip pizzas — they exist for tourists.",
          why: "The view restaurant locals send their cousins to, not the one Instagram sends you to.",
          travelToNextMin: 35
        },
        {
          id: "tukad-cepung",
          name: "Tukad Cepung Waterfall",
          category: "Nature · Hike",
          lat: -8.5708, lng: 115.4014,
          duration: "1.5h",
          bestTime: "15:00–16:30",
          description: "Hidden cave waterfall with a famous light beam at midday.",
          localTip: "Wear sandals you can soak — the last 100m is wading. Light beam best 11am–1pm; afternoon is just water (still gorgeous, fewer humans).",
          why: "Less crowded than Kanto Lampo and twice as cinematic.",
          travelToNextMin: null
        }
      ]
    },
    {
      dayNumber: 3,
      title: "Sidemen Valley",
      area: "Sidemen",
      theme: "Slow Day · Quiet East",
      color: DAY_COLORS[2],
      stops: [
        {
          id: "sidemen-rice",
          name: "Sidemen Rice Walk",
          category: "Nature · Walk",
          lat: -8.4894, lng: 115.4456,
          duration: "2h",
          bestTime: "7:30–9:30 AM",
          description: "Self-guided walk through working rice fields with Mt Agung as backdrop.",
          localTip: "Start at Subak Sembung trail. A farmer named Wayan usually offers fresh young coconut at the bend — say yes.",
          why: "What Ubud felt like 20 years ago. No tour buses can fit on these roads.",
          travelToNextMin: 12
        },
        {
          id: "tenganan",
          name: "Tenganan Village",
          category: "Culture",
          lat: -8.4781, lng: 115.5739,
          duration: "1.5h",
          bestTime: "10:30–12:00",
          description: "Pre-Hindu Bali Aga village — original Balinese culture, double-ikat weaving.",
          localTip: "Buy ikat directly from the weaver in the third house on the right. Fixed prices, no haggling. The fakes outside are 1/10 the price for a reason.",
          why: "Genuinely different culture from the rest of Bali. Not a recreation.",
          travelToNextMin: 25
        },
        {
          id: "warung-uma-anyar",
          name: "Warung Uma Anyar",
          category: "Food · Valley View",
          lat: -8.4948, lng: 115.4501,
          duration: "1.5h",
          bestTime: "13:00–14:30",
          description: "Family-run warung perched over the valley.",
          localTip: "Sit in the back deck, not the road-side one. Order whatever the grandma is cooking that day — it's not on the menu.",
          why: "Best lunch view in east Bali, full stop.",
          travelToNextMin: 8
        },
        {
          id: "sidemen-spa",
          name: "Wapa di Ume Spa",
          category: "Wellness",
          lat: -8.4912, lng: 115.4488,
          duration: "2h",
          bestTime: "15:30–17:30",
          description: "Open-air massage huts with rice paddy view.",
          localTip: "Book the 90-min Balinese, not the signature. Same hands, half the upsell.",
          why: "Recovery before tomorrow's south Bali day.",
          travelToNextMin: null
        }
      ]
    },
    {
      dayNumber: 4,
      title: "South Coast — Uluwatu",
      area: "Uluwatu / Bukit",
      theme: "Beach · Cliff · Sunset",
      color: DAY_COLORS[3],
      stops: [
        {
          id: "bingin-beach",
          name: "Bingin Beach",
          category: "Beach",
          lat: -8.8035, lng: 115.1186,
          duration: "3h",
          bestTime: "9:00–12:00",
          description: "Tide-pool beach down a cliff staircase, surfer crowd.",
          localTip: "Park at the top and walk down — scooter parking at the bottom is a scam. Rent a board from Mick's, not the first stand you see.",
          why: "Cleaner sand and clearer water than Padang Padang, fraction of the crowd.",
          travelToNextMin: 18
        },
        {
          id: "drifter-cafe",
          name: "Drifter Surf Cafe",
          category: "Food · Healthy",
          lat: -8.8081, lng: 115.1234,
          duration: "1h",
          bestTime: "12:30–13:30",
          description: "Acai, smoothie bowls, surfboard shop attached.",
          localTip: "The 'small' bowl is huge. Share one and order an extra coffee.",
          why: "Closest thing to lunch that won't put you to sleep before sunset.",
          travelToNextMin: 14
        },
        {
          id: "uluwatu-temple",
          name: "Uluwatu Temple & Kecak",
          category: "Temple · Performance",
          lat: -8.8290, lng: 115.0849,
          duration: "2h",
          bestTime: "17:00–19:00",
          description: "Cliff temple at the southern tip + 6pm Kecak fire dance.",
          localTip: "Buy Kecak tickets online 2 hours before — gate price doubles. Sit on the right side, third row up; left gets sun-blasted till 6:20.",
          why: "Yes it's the famous one. No, it's not skippable. Sunset-temple-on-a-cliff is the demo Bali sells.",
          travelToNextMin: 9
        },
        {
          id: "single-fin",
          name: "Single Fin",
          category: "Drinks · Sunset",
          lat: -8.8128, lng: 115.0883,
          duration: "2h",
          bestTime: "19:30–21:30",
          description: "Cliffside bar with the surf lineup directly below.",
          localTip: "Sundays are packed. Tuesday/Wednesday same view, half the bodies, full menu.",
          why: "A drink with your feet up while Uluwatu's lineup glows under the cliff lights.",
          travelToNextMin: null
        }
      ]
    }
  ]
};

// Project Bali coordinates onto our SVG canvas
// Bali roughly: lng 114.4–115.7, lat -8.05 to -8.85
var MAP_BOUNDS = { minLng: 114.42, maxLng: 115.72, minLat: -8.86, maxLat: -8.06 };
function projectLatLng(lat, lng, w, h) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * w;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * h;
  return { x, y };
}

window.PETA_DATA = { ITINERARY, DAY_COLORS, MAP_BOUNDS, projectLatLng };
