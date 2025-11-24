const express = require('express');
const router = express.Router();

const GOOGLE_API_KEY = 'AIzaSyDPTAYv98aQf7H5BTfniPk0sCIboHlHv2Q';
const SEARCH_ENGINE_ID = '166746689629a4d43';

/**
 * GET /api/bookings/search
 * Search for exact hotel/restaurant links using quoted name search.
 */
router.get('/search', async (req, res) => {
    const { name, city, type } = req.query;
    if (!name || !city) {
        return res.status(400).json({
            success: false,
            message: 'Name and city are required',
            links: [],
            fallbackUrl: 'https://www.google.com/search'
        });
    }
    try {
        // Use exact name + city in quotes for phrase matching
        const exactName = `"${name} ${city}"`;
        console.log('Searching with exact name:', exactName);
        const googleApiUrl = 
            `https://www.googleapis.com/customsearch/v1` +
            `?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}` +
            `&q=${encodeURIComponent(exactName)}&num=10`;
        const response = await fetch(googleApiUrl);
        const data = await response.json();
        
        if (data.error) {
            console.error('Google API Error:', data.error);
            return res.json({
                success: false,
                message: data.error.message || 'API error',
                links: [],
                fallbackUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city)}`
            });
        }
        
        if (!data.items || data.items.length === 0) {
            console.log('No results found for:', exactName);
            return res.json({
                success: true,
                message: 'No results found',
                links: [],
                fallbackUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city)}`
            });
        }
        
        // Filter and validate results
        const validatedLinks = filterAndValidateLinks(data.items, name, city, type);
        console.log(`Found ${validatedLinks.length} validated results for ${name}`);
        
        if (validatedLinks.length === 0) {
            return res.json({
                success: true,
                message: 'No valid results found',
                links: [],
                fallbackUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city)}`
            });
        }
        
        res.json({
            success: true,
            message: `Found ${validatedLinks.length} options`,
            links: validatedLinks
        });
        
    } catch (error) {
        console.error('Booking search error:', error);
        res.json({
            success: false,
            message: 'Search failed. Please try the fallback link.',
            links: [],
            fallbackUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city)}`
        });
    }
});

/**
 * Filter and validate search results to ensure they match the hotel/restaurant.
 */
function filterAndValidateLinks(items, hotelName, city, type) {
    const validatedLinks = [];
    const hotelNameLower = hotelName.toLowerCase();
    const cityLower = city.toLowerCase();
    const typeLower = (type || '').toLowerCase();
    
    // Generic keywords indicating non-specific pages
    const ignoreKeywords = [
        'hotels in', 'restaurants in', 'best hotels', 'top restaurants',
        'list of', 'directory', 'all hotels', 'find hotels',
        'hotel booking', 'restaurant guide', 'travel guide',
        'map of', 'location of', 'near me', 'hotels near'
    ];
    
    for (const item of items) {
        if (validatedLinks.length >= 3) break;  // Only top 3
        
        const title = item.title.toLowerCase();
        const snippet = (item.snippet || '').toLowerCase();
        const url = item.link.toLowerCase();
        
        // Exclude generic or city-level results
        const hasIgnored = ignoreKeywords.some(keyword =>
            title.includes(keyword) && !title.includes(hotelNameLower)
        );
        if (hasIgnored) {
            console.log(`Skipping (generic): ${item.title}`);
            continue;
        }
        
        // Check for exact name presence
        const nameInTitle = title.includes(hotelNameLower);
        const nameInSnippet = snippet.includes(hotelNameLower);
        const nameInUrl = url.includes(hotelNameLower.replace(/\s+/g, '-')) ||
                          url.includes(hotelNameLower.replace(/\s+/g, ''));
        
        if (!nameInTitle && !nameInSnippet && !nameInUrl) {
            // Allow close matches: require most name words to appear
            const nameWords = hotelNameLower.split(/\s+/).filter(w => w.length > 2);
            let matched = 0;
            for (const word of nameWords) {
                if (title.includes(word) || snippet.includes(word) || url.includes(word)) {
                    matched++;
                }
            }
            let threshold;
            if (nameWords.length > 3) {
                threshold = nameWords.length - 1;
            } else if (nameWords.length === 3) {
                threshold = 2;
            } else {
                threshold = nameWords.length;
            }
            if (matched < threshold) {
                console.log(`Skipping (name not found): ${item.title}`);
                continue;
            }
        }
        
        // Exclude map-only pages
        if (
            url.includes('google.com/maps') || url.includes('bing.com/maps') ||
            url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') ||
            url.includes('mapsofindia') || url.includes('mapquest')
        ) {
            console.log(`Skipping (map page): ${item.title}`);
            continue;
        }
        
        // Add as a validated candidate with a match score
        const domain = extractDomain(item.link);
        validatedLinks.push({
            id: validatedLinks.length + 1,
            title: cleanTitle(item.title),
            url: item.link,
            description: item.snippet || '',
            displayUrl: domain,
            matchScore: calculateMatchScore(item, hotelNameLower, cityLower, typeLower)
        });
    }
    
    // Sort by descending match score
    validatedLinks.sort((a, b) => b.matchScore - a.matchScore);
    
    // Return top 3 (strip out internal matchScore)
    return validatedLinks.slice(0, 3).map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        displayUrl: link.displayUrl
    }));
}

/**
 * Calculate match score for a search result.
 */
function calculateMatchScore(item, hotelName, city, type) {
    let score = 0;
    const title = item.title.toLowerCase();
    const snippet = (item.snippet || '').toLowerCase();
    const url = item.link.toLowerCase();
    
    // Exact name in title (highest weight)
    if (title.includes(hotelName)) score += 10;
    if (snippet.includes(hotelName)) score += 5;
    if (
        url.includes(hotelName.replace(/\s+/g, '-')) ||
        url.includes(hotelName.replace(/\s+/g, ''))
    ) {
        score += 3;
    }
    // City name presence
    if (title.includes(city) || snippet.includes(city)) score += 2;
    // Booking/reservation intent
    if (
        title.includes('book') || title.includes('reserve') ||
        snippet.includes('book') || snippet.includes('reserve')
    ) {
        score += 1;
    }
    // Restaurant menu (if applicable)
    if (type === 'restaurant' && (title.includes('menu') || snippet.includes('menu'))) {
        score += 1;
    }
    // Review keyword
    if (title.includes('review') || snippet.includes('review')) {
        score += 1;
    }
    return score;
}

/**
 * Clean up title by removing known platform suffixes/branding.
 */
function cleanTitle(title) {
    return title
        .replace(/\s*[-|]\s*(Booking\.com|MakeMyTrip|Goibibo|Agoda|TripAdvisor|Zomato|Swiggy|Google|Hotels\.com|Expedia|Trivago|OpenTable|Yelp).*$/i, '')
        .replace(/\s*\.\.\.$/, '')
        .replace(/\s*-\s*Google\s*Search$/i, '')
        .trim();
}

/**
 * Extract the domain from a URL.
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

/**
 * Health check endpoint.
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Booking API is running',
        googleApiConfigured: GOOGLE_API_KEY !== 'AIzaSyDPTAYv98aQf7H5BTfniPk0sCIboHlHv2Q',
        version: '3.0 - Exact Name Phrase Search'
    });
});

module.exports = router;
