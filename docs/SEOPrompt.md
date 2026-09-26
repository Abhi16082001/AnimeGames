Implement comprehensive **on-page and technical SEO** for the AnimeGames Astro website.

First inspect the existing project, especially the homepage, `/games/`, shared `Layout.astro`, existing metadata, headings, content, images, routing, and any existing sitemap/robots configuration. **Preserve existing good content and SEO; only modify or add what is necessary.**

The Brand Name is 'Otaku Blitz' and the domain name is 'otakublitz.com'

### 1. Homepage `/`

**Primary keyword:**
* OtakuBlitz

**Supporting keywords:**
* otaku
* blitz
* anime games online
* free anime games
* anime quiz game
* guess the character

Optimize the homepage naturally around these keywords.

Check the existing homepage content first. If it does not already contain sufficient useful SEO-focused content, add approximately **600 words of unique, helpful content** related to anime games, anime quizzes, guessing games, and playing anime games online.

Use one clear `<h1>` and an appropriate `<h2>`/`<h3>` hierarchy.

### 2. Games page `/games/`

Choose an appropriate primary keyword based on the actual page content.

Naturally incorporate these supporting keywords where relevant:

* Description game
* hint game
* guessing game
* zoomed image game
* zoom game
* color games
* hue game
* color guessing game
* color hue game
* quiz game
* anime quiz game
* Naruto quiz game
* Bleach quiz game
* Dragon Ball Z quiz game
* Pokémon quiz game
* One Piece quiz game
* guess the character
* guess the anime character
* anime iq

Do not force keywords into headings or content where they do not naturally fit.

### 3. Metadata

Implement unique, page-specific:

* SEO title
* Meta description
* Canonical URL
* `og:title`
* `og:description`
* `og:url`
* `og:type`
* `og:image`
* `og:site_name`

Do not use identical metadata for every page.

### 4. Headings

Audit important indexable pages:

* Exactly one `<h1>` must be there per page.
* Correct `<h2>` → `<h3>` hierarchy.
* Headings should describe actual page content.
* Do not use headings purely for styling.

### 5. Images

Audit image SEO:

* Add meaningful `alt` text.
* Use `alt=""` for purely decorative images where appropriate.
* Avoid keyword-stuffed alt text.
* Use suitable image dimensions and formats.
* Add `width`/`height` where practical to reduce layout shift.
* Lazy-load non-critical images where appropriate.
* Do not unnecessarily lazy-load the main above-the-fold/LCP image.

### 6. Internal linking

Improve useful internal links between the homepage, games page, individual games, anime categories, and relevant quiz pages.

Use descriptive anchor text and avoid artificial SEO links.

### 7. Structured data

Implement **valid Schema.org JSON-LD** and follow Google's current official structured-data guidelines.

The website already has an **FAQ section**. Do **not** create, add, remove, or redesign any new FAQ/Q&A section.

For the **existing FAQ section only**, add appropriate JSON-LD structured data using the following structure as the reference:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "QAPage",
  "mainEntity": {
    "@type": "Question",
    "name": "How many ounces are there in a pound?",
    "text": "How many ounces are in a pound?",
    "answerCount": 1,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "1 pound (lb) is equal to 16 ounces (oz)."
    }
  }
}
</script>
```

Use the **actual questions and answers already present in the existing FAQ section**. Do not use the example question/answer above.

Generate the JSON-LD dynamically from the existing FAQ content where practical so the structured data remains synchronized with the visible FAQ.

Do not invent questions or answers, and do not add FAQ content solely for SEO.

For the existing FAQ:
* Each actual FAQ question should be represented correctly.
* Use the actual visible question as `name` and `text`.
* Use the actual visible answer as `acceptedAnswer.text`.
* Set `answerCount` correctly.
* Keep the structured data consistent with what users can see on the page.

Do not add any separate Q&A, FAQ, or `QAPage` section elsewhere on the website.

Other structured data such as `WebSite`, `WebPage`, `BreadcrumbList`, or `VideoGame` may be added only where genuinely applicable to the existing content.

### 8. Technical SEO

Implement and audit:

* `robots.txt`
* `sitemap.xml`
* Canonical URLs
* Indexability
* Mobile viewport
* HTTPS URLs
* Clean URLs
* 404 page
* Broken internal links
* Accidental `noindex`
* Duplicate URLs

The sitemap should contain only pages that should actually be indexed.

### 9. Astro implementation

Use the existing project architecture.

Inspect `Layout.astro` before modifying `<head>` elements. Prefer a reusable SEO implementation so individual pages can provide their own title, description, canonical URL, image, and relevant structured data without duplicating code.

Use existing configuration values instead of hard-coding values that are already defined elsewhere.

### 10. Final verification

After implementation:

* Run the Astro build and fix errors.
* Verify one H1 per important page.
* Verify unique titles and descriptions.
* Verify canonical URLs.
* Verify Open Graph metadata.
* Verify `robots.txt` and `sitemap.xml`.
* Verify image alt text.
* Verify structured data.
* Verify internal links.
* Ensure the existing design and functionality remain unchanged.

The objective is **natural, useful SEO**, not keyword stuffing or artificially generated content.