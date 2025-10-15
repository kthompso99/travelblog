# Travel Blog Website

A data-driven travel blogging platform with interactive world map, continent-based navigation, and markdown content pages.

## Features

- 📍 **Interactive World Map**: Click map markers to navigate to destination pages
- 🗺️ **Continent-Based Menu**: Dynamically organized destinations by continent
- 📝 **Markdown Content**: Write blog posts in simple markdown format
- ⚙️ **Configuration-Driven**: Single JSON file controls all destinations
- 📱 **Responsive Design**: Works beautifully on all devices
- 🎨 **Modern UI**: Clean, professional design with smooth animations

## Project Structure

```
travel-blog/
├── index.html              # Main website file
├── config.json            # Configuration for all destinations
├── content/               # Markdown files for each location
│   ├── greece.md
│   ├── newzealand.md
│   └── [destination].md
└── images/                # Optional thumbnail images
    ├── paris.jpg
    └── [destination].jpg
```

## Setup Instructions

### 1. Basic Setup

1. Create a new folder for your project
2. Save all the files (index.html, config.json, build.js, package.json)
3. Create a `content/` folder for your markdown files
4. Install Node.js if you haven't already (from nodejs.org)

### 2. Install Dependencies

```bash
npm install
```

This installs the `marked` package needed for markdown conversion.

### 3. Configure Destinations

Edit `config.json` to add your destinations:

```json
{
  "site": {
    "title": "Your Blog Name",
    "description": "Your blog description"
  },
  "destinations": [
    {
      "id": "unique-id",
      "name": "City, Country",
      "continent": "Continent Name",
      "country": "Country",
      "location": "Famous Landmark or Place Name",
      "contentFile": "content/filename.md",
      "thumbnail": "images/thumbnail.jpg"
    }
  ]
}
```

**Important Fields:**
- `id`: Unique identifier (lowercase, use hyphens)
- `name`: Display name for the destination
- `continent`: One of: Europe, Asia, Africa, North America, South America, Oceania, Antarctica
- `location`: Any place name that can be geocoded (e.g., "Eiffel Tower", "Tokyo Tower", "Big Ben, London")
  - The system automatically converts this to coordinates!
  - If omitted, will use the `name` field for geocoding
- `contentFile`: Path to your markdown content file
- `thumbnail`: (Optional) Path to thumbnail image

**Note**: You can still use `coordinates` manually if you prefer:
```json
"coordinates": { "lat": 48.8566, "lng": 2.3522 }
```
If `coordinates` are provided, the `location` field is ignored.

### 3. Create Content Pages

Create markdown files in the `content/` folder. Each file should contain:

```markdown
# Destination Name

Your introduction paragraph...

## Section Heading

Your content...

### Subsection

More details...
```

See `paris.md` for a complete example.

### 4. Run the Website

#### Option A: Local Development
Use a local web server (required for loading external files):

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

#### Option B: Deploy Online
Upload all files to any web hosting service:
- GitHub Pages
- Netlify
- Vercel
- Traditional web hosting

## Adding New Destinations

1. **Add to config.json**:
   ```json
   {
     "id": "rome",
     "name": "Rome, Italy",
     "continent": "Europe",
     "country": "Italy",
     "location": "Colosseum, Rome",
     "contentFile": "content/rome.md"
   }
   ```

2. **Create content file**: `content/rome.md`

3. **Refresh the website** - everything updates automatically!

## Customization

### Change Colors
Edit the CSS in `index.html` to modify the color scheme:
- Header gradient: `.header` background
- Accent color: Search for `#667eea` and `#764ba2`

### Add Custom Sections
Add new pages by creating content and linking in the navigation menu.

### Modify Map Style
Change the map tiles by editing the `L.tileLayer` URL in the JavaScript.

## Geocoding

The system automatically converts place names to coordinates using OpenStreetMap's Nominatim service.

### Tips for Location Names:
- Be specific: "Eiffel Tower, Paris, France" is better than just "Paris"
- Use famous landmarks for better accuracy
- Include city and/or country for disambiguation
- Examples that work well:
  - "Big Ben, London"
  - "Statue of Liberty"
  - "Tokyo Tower"
  - "Machu Picchu, Peru"

### Fallback Options:
1. If geocoding fails, the marker defaults to coordinates (0, 0)
2. You can always manually specify coordinates to override geocoding
3. Check browser console to see geocoded coordinates

## Getting Coordinates

To find latitude and longitude for locations (if you want to manually specify them):
1. Search on [Google Maps](https://maps.google.com)
2. Right-click the location
3. Click the coordinates to copy them
4. Add to config: `"coordinates": { "lat": XX.XXXX, "lng": XX.XXXX }`

**Note**: Manual coordinates take precedence over the `location` field.

## Tips

- Keep markdown files focused and well-structured
- Use descriptive file names (lowercase-with-hyphens)
- Optimize images before uploading (recommended: max 1200px wide)
- Test on mobile devices to ensure responsive design works
- Add your own personality and writing style!

## Troubleshooting

**Content not loading?**
- Ensure you're using a web server (not file://)
- Check that file paths in config.json are correct
- Check browser console for errors (F12)

**Map not showing?**
- Check internet connection (requires OpenStreetMap tiles)
- Verify location names are specific enough for geocoding
- Check browser console to see if geocoding was successful
- Consider using manual coordinates if geocoding fails

**Menu not populating?**
- Verify config.json has valid JSON syntax
- Check browser console for parsing errors

## Technologies Used

- **Leaflet.js**: Interactive map functionality
- **Marked.js**: Markdown to HTML conversion
- **OpenStreetMap**: Map tiles
- Pure HTML/CSS/JavaScript - no build process required!

## License

Feel free to use this template for your own travel blog!

---

Happy blogging! 🌍✈️
