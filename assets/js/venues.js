// CHIDAOBA, venues that camps can use.
// Pick a venue in the admin camp editor; the camp page then shows its photos,
// facilities, meals and map. A camp's own photos / address override these.
(function () {
  var M = '/assets/venues/mulakhi/';
  function g(n, alt) { return { url: M + n + '.webp', thumb: M + n + '-sm.webp', alt: alt }; }
  window.CHD_VENUES = {
    mulakhi: {
      name: 'Ilia Gabliani Sports Complex',
      name_ka: 'ილია გაბლიანის სახელობის სპორტული კომპლექსი',
      place: 'Mulakhi, Svaneti',
      address: 'Mulakhi, Mestia Municipality, Svaneti, Georgia',
      map_query: 'Mulakhi, Mestia, Georgia',
      intro: 'A mountain sports complex in Mulakhi, Upper Svaneti. Training, accommodation and meals under one roof, with the Caucasus all around.',
      cover: g('summer-pitch', 'The complex’s mini stadium with the mountains of Svaneti behind it'),
      facts: [['11', 'guest rooms'], ['40', 'beds'], ['800 m²', 'training hall'], ['3-4', 'meals a day']],
      indoor: ['Training hall, 800 m²', 'Tatami', 'Boxing ring & heavy bags', 'Gym equipment', 'Climbing wall', 'Sauna', 'Dining hall', 'Lounge', '11 guest rooms for 40 people'],
      outdoor: ['Mini stadium (artificial turf)', 'Swimming pool'],
      menu: [
        { meal: 'Breakfast', items: 'Porridge (pasta or rice), eggs, honey, butter, cheese, sausages, sour cream or matsoni, buns, bread, tea / coffee' },
        { meal: 'Lunch', items: 'Soup (chicken or beef, soup, borscht, meatball soup, tolma), or a cutlet / boiled meat or chicken with a side (mashed potato, buckwheat, pasta or rice); vegetable salad, cheese, compote or kissel, fruit, bread' },
        { meal: 'Dinner', items: 'Khachapuri, lobiani or kubdari, buns or biscuits, matsoni or sour cream, butter, cheese, honey / jam, tea / coffee' }
      ],
      gallery: [
        g('summer-pitch', 'Mini stadium with a view down the valley'),
        g('hall-mats', 'Training hall with mats and climbing rope'),
        g('hall-ring', 'Training hall with boxing ring and gym equipment'),
        g('training-hall', 'Training hall with tatami'),
        g('summer-terrace-pool', 'Stone terrace and outdoor pool beside the complex'),
        g('exterior', 'The sports complex building in Mulakhi'),
        g('climbing-wall-2', 'Indoor climbing wall'),
        g('gym', 'Gym equipment'),
        g('stadium', 'Artificial-turf mini stadium surrounded by mountains'),
        g('dining-hall', 'Dining hall'),
        g('kitchen-buffet', 'Buffet counter'),
        g('lounge', 'Lounge under the roof'),
        g('bunk-room', 'Guest room with bunk beds'),
        g('guest-room', 'Guest room'),
        g('bathroom', 'Guest bathroom'),
        g('showers', 'Showers')
      ]
    }
  };
})();
