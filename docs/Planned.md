  1. Color game for gamescategory.json:
  {
    "id": "colour",
    "name": "Colour Guessing Game",
    "show": true,
    "gamepath": "/games/colour",
    "questionLimit": 4,
    "imagepath": "/gamecategory/colour.webp"
  }
  
  2. And add more game category in animecategory.json 

  3. Daily challenge:
  IN leaderboard page: uncomment daily challenge values in two arrays.
And make it true in google script.

4. Toggle mode:
uncomment trollmodetoggle tag from games->index.astro and components->animeselect.astro

5. Final sitemap.xml

<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.otakublitz.com/</loc></url>
  <url><loc>https://www.otakublitz.com/games/</loc></url>
  <url><loc>https://www.otakublitz.com/games/description/</loc></url>
  <url><loc>https://www.otakublitz.com/games/zoomed/</loc></url>
  <url><loc>https://www.otakublitz.com/games/colour/</loc></url>
  <url><loc>https://www.otakublitz.com/games/description/naruto/</loc></url>
  <url><loc>https://www.otakublitz.com/games/description/onepiece/</loc></url>
  <url><loc>https://www.otakublitz.com/games/description/bleach/</loc></url>
  <url><loc>https://www.otakublitz.com/games/description/pokemon/</loc></url>
  <url><loc>https://www.otakublitz.com/games/description/dragonballz/</loc></url>
  <url><loc>https://www.otakublitz.com/games/zoomed/naruto/</loc></url>
  <url><loc>https://www.otakublitz.com/games/zoomed/onepiece/</loc></url>
  <url><loc>https://www.otakublitz.com/games/zoomed/bleach/</loc></url>
  <url><loc>https://www.otakublitz.com/games/zoomed/pokemon/</loc></url>
  <url><loc>https://www.otakublitz.com/games/zoomed/dragonballz/</loc></url>
  <url><loc>https://www.otakublitz.com/games/colour/naruto/</loc></url>
  <url><loc>https://www.otakublitz.com/games/colour/onepiece/</loc></url>
  <url><loc>https://www.otakublitz.com/games/colour/bleach/</loc></url>
  <url><loc>https://www.otakublitz.com/games/colour/pokemon/</loc></url>
  <url><loc>https://www.otakublitz.com/games/colour/dragonballz/</loc></url>
  <url><loc>https://www.otakublitz.com/leaderboard/</loc></url>
  <url><loc>https://www.otakublitz.com/about/</loc></url>
  <url><loc>https://www.otakublitz.com/contact/</loc></url>
  <url><loc>https://www.otakublitz.com/privacy-policy/</loc></url>
  <url><loc>https://www.otakublitz.com/terms-and-conditions/</loc></url>
</urlset>
