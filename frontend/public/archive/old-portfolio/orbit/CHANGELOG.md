# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed
- ORBIT-411 - Missing calculate button on the tables page matrix field

### Removed


## [2.2.0] - 27-10-2020

### Added
- ORBIT-409 - Add XFP components demo page to the full HTML prototypes
- ORBIT-365 - Add th class styling
- ORBIT-189 - Add masonry layout to generic listing page
- ORBIT-400 - Added latest core XFP templates from v.6.7
- ORBIT-302 - XFP - Error message needs styling
- ORBIT-377 - Provide twing functions to allow dummy data for default Photon navigation in menu.html.twig
- ORBIT-324 - CXM - My account widget styling
- ORBIT-308 - XFP - Resume form area needs styling
- ORBIT-318 - Skip map button required on directory search results page
- ORBIT-344 - Add descriptive text to A-Z directory records
- ORBIT-320 - Add descriptive text to A-Z service links for screenreader users
- ORBIT-338 - Show an example Flash message alert on the home page when site.announcement.visible is set to true in the JSON settings
- ORBIT-326 - Add related downloads and directories menu to the sidebar on the document page examples
- ORBIT-334 - Add external to external links aria label
- ORBIT-315 - Add "items" to twing so we can use it in widgets without declaring it each time
- ORBIT-321 - Help text to be read out automatically when tabbing onto form components

### Changed
- ORBIT-369 - Form action button positioning on the payment review page
- ORBIT-366 - Payments complete page - Tidy up the table layout so we’re not outputting empty cells when CXM is disabled/empty
- ORBIT-363 - Change focus colour
- ORBIT-220 - 50/50 homepage layout has 75/25 row with content widget and image widget and reorder widgets
- ORBIT-341 - Directory record - Increase gap between heading and table on smaller screens
- ORBIT-397 - Print styles - Force single column layout and remove related links navigation and navigation supplement from sidebar
- ORBIT-384 - Set default masonry layout to ‘horizontalOrder: true’ so 3 column layouts always go left to right and don’t skip the middle space
- ORBIT-323 - SR - Repeatable question (xfp-twig)
- ORBIT-294 - Update footer supplier links
- ORBIT-375 - Font on news and content widgets is different
- ORBIT-106 - Completely refactored carousels JS to be accessible following the example set by (https://www.w3.org/WAI/tutorials/carousels/working-example/)

### Fixed
- ORBIT-406 - Remove forced width on alert headings on mobile causing text to drop onto two lines unnecessarily
- ORBIT-399 - Update the static_temp folder so we can easily run Browsersync from a Galaxies site sub-domain
- ORBIT-365 - Payments - basket on flags error with multiple 'remove' buttons
- ORBIT-381 - Add a clearfix in case the last paragraph in editor text contains a floated image
- ORBIT-366 - Payments successful - Remove the gap between the reference and the page meta below
- ORBIT-400 - Fix broken path to theme:xfpbase in prototypes
- ORBIT-395 - Fix broken placeholder mixin so we can more easily change the colour of placeholder text
- ORBIT-213 - Prevent double-tabbing on carousel arrow SVG in IE11
- ORBIT-323 - SR - Repeatable question (xfp-twig)
- ORBIT-345 - Remove the Spacecraft logo and change to new Jadu Creative one
- ORBIT-357 - Improved styling of download listings using flexbox to vertically center
- ORBIT-332 - Matrix table - Force horizontal scrollbar to be visible by default on IOS
- ORBIT-329 - Increase start limit of editor lists
- ORBIT-294 - Update footer supplier links
- ORBIT-381 - Add a clearfix in case the last paragraph in editor text contains a floated image
- ORBIT-304 - Location component button alignment (XFP)
- ORBIT-378 - Allow images in the content widget to go full-width or centered without jeopardising default max line length of 44em
- ORBIT-310 - Edit/remove button alignment
- ORBIT-343 - Remove double margins with p tags inside a floated image caption
- ORBIT-358 / PHOT-423 - Provide a default fallback image for the preview on the image upload component
- ORBIT-339 - google_map modifier class has been changed to BEM google-map - breaking the skip map buttons JS
- ORBIT-193 - Large button drops onto it's own line at certain breakpoints
- ORBIT-307 - XFP - completed progress bar colour will fail colour contrast
- ORBIT-305 - XFP - reduce spacing between component and error message
- ORBIT-304 - Location component button alignment (XFP)
- ORBIT-338 - Wrap the Flash message alert on full-width homepages in it’s own container, and stop the empty alert link arrow from appearing when there is no link defined
- ORBIT-340 - Apply missing focus effect to the image upload button
- ORBIT-333 - IE11 fixes for changes made on ORBIT-250 with left-floated image captions in .editor text
- ORBIT-311 / ORBIT-316 - XFP - Repeatable content issue / form summary responsive table issue
- ORBIT-300 - XFP - JS disabled issues
- ORBIT-299 - XFP - wave errors on the individual form page
- ORBIT-301 - XFP - Lookup button is misaligned
- ORBIT-328 - Add check that supplement and after content blocks contain content before outputting an empty container on one-column homepages
- ORBIT-325 - Fix broken links on meetings listing page causing all links in the list to appear as :visited
- ORBIT-322 - Add missing internal hyperlink above Opengraph image on branding page
– ORBIT-296 - Tables in responsive view is missing top row (top left cell)
- ORBIT-297 - Fix to replace `dd/mm/yyyy` help text with `yyyy-mm-dd` on Safari and IE on event submission form
- ORBIT-330 - Correct twig destination folder

### Removed
- ORBIT-364: Remove $color-text-disabled variable and use $color-text-muted instead for disabled form fields
- ORBIT-361: Remove Jadu / Spacecraft colour variables
- ORBIT-373: Remove Zoom plugin from Orbit


## [2.1.0] - 23-03-2020

### Added
– ORBIT-296 - Create a variable to give us the option to quickly disable the ‘cancel’ button on search inputs in IE11, Edge, Safari and Chrome
- ORBIT-272 - Flexbox min-height to push the footer to the bottom on smaller pages now applies to all breakpoints. On tablet we need javascript to offset the min-height based on the height of the browser chrome.
- ORBIT-241 - Style calendar links
- ORBIT-87 - New callback listeners for show/hide in custom a11y-toggle JS include
- ORBIT-89 - Added filter bar menu to listing pages
- ORBIT-90 - Added default Jadu form pages to the full prototype
- ORBIT-91 - ADD thead/tbody to website statistics widget and add custom widget folder
- ORBIT-131 - Improvements to 'out-of-the-box' print styles
- ORBIT-135 - Fix page height issue on IE11
- ORBIT-159 - Add site wide announcements to data, ability to switch on and off
- ORBIT-129 - Add stacked widgets to orbit
- ORBIT-119 - Add egov contact supplement
- ORBIT-94 - Add masonry to listing pages
- ORBIT-145 - Add meta to typography page (to match build process)
- ORBIT-166 - Review backwards tabbing behaviour around open menus & search
- ORBIT-172 - Escape to close menu / search
- ORBIT-185 - page-break-before: always; on map print styles
- ORBIT-152 - Add address nl2br filter to address (contact supplement)
- ORBIT-171 - Added textWordbreak mixin
- ORBIT-143 - Refactor .list--navigation so there is a variable to turn the default arrows on/off
- ORBIT-173 - Added comment to matchHeight helper giving an example on how to use it

### Changed
- ORBIT-226 - Remove skip to nav link (This is now for a UXer to reinstate on a per project basis if necessary)
- ORBIT-223 - Add BEM classes and make only the ‘Jadu’ and ‘Spacecraft’ links actually links (and add titles for screenreaders)
- ORBIT-281 - Improve the javascript for external links so they A) work in Safari and B) Are displayed inline rather than inline-block.
- ORBIT-221 - Stop extra-long radio and checkbox labels overflowing their container and top-align the pseudo elements
- ORBIT-86 - Twing fixes and modular layout updates
- ORBIT-108 - Split the colour swatch into primary and secondary palettes
- ORBIT-130 - We can’t make maps accessible or pass Siteimprove… but what we can do is provide a button for keyboard users to skip the map entirely.
- ORBIT-133 - Update typeface link to point to Google Open Sans font
- ORBIT-134 - Fix date formatting by upgrading Twing to v.2.1.2 and upgrade all twig templates to match core Photon v.2.6.0
- ORBIT-139 - Improved experience for screenreaders on the site logo link
- ORBIT-167 - Custom checkbox and radio styling (using pseudo elements) that can be customised consistently on all browsers (including IE11)
- ORBIT-168 - Disable max line-length on .form__instructions editor text when the form layout is full-width
- ORBIT-184 - Update normalize, use npm
- ORBIT-192 - Make the index page A homepage not THE homepage
- ORBIT-238 - Amended grouped list spacing
- ORBIT-235 - Adjusted spacing for breadcrumb items
- ORBIT-225 - Increased footer copyright text font size
- ORBIT-285 - Apply transform to site container instead of body
- ORBIT-274 - set pages in to 2 columns on print
- ORBIT-202-2 - remove supplements added to the homepage
- ORBIT-234 - amend map spacing in definition list
- ORBIT-243 - Change what's new date to a span, to prevent being read out twice by screen readers
- ORBIT-254 - Amend sidebar breakpoint/width, keep pages in open when resize on mobile
- ORBIT-224 - Amend link underlines

### Fixed
- ORBIT-283 - Fix for date input label format in IE
- ORBIT-288 - a11yToggle conflict - only apply if aria-labelledby attr too, and only apply within site wrapper to reduce third party conflicts
- ORBIT-286 - Responsive table heading styling fixes
- ORBIT-242 - Image link focus effect in IE11
- ORBIT-245 - Featured news image flexbox fix
- ORBIT-237 - H2 is appearing before H1 due to main menu nav list
- ORBIT-211 - Apply blockquote styling to the parent element so it doesn't matter what order / format the editor content inside is in.
- ORBIT-219 - toggle-mobile-swap.js bugfix - Only auto-close the pages-in nav menu when resizing from desktop to mobile view, not for orientation change.
- ORBIT-217 - CSS validation: Invalid separator in shape definition. clip: rect() in visually-hidden mixin must use commas.
- ORBIT-198 - Allow non-array JSON data to be passed to the gulp-twing incidental_content function
- ORBIT-107 - gulp --prod didn't work in implementation mode :-(
- ORBIT-105 - Fixed logic issue causing twig() function to never return done() in production mode
- ORBIT-44 - Responsive tables bugfix
- Bugfix for Flickity conflicting with a11y-toggle [aria-hidden] CSS rule
- ORBIT-128 - Add a clearfix to 'widget' and 'widget-width'
- ORBIT-122 - Asset paths returning incorrect URLs on galaxies sites
- ORBIT-137 - Fixes for the 2 column CSS layout option in pages-in nav.
- ORBIT-153 - Use raw filter for supplement description to fix twing issue
- ORBIT-162 - Logo in offline page needs more padding
- ORBIT-174 - aria-label failure noted against skip to action
- ORBIT-194 - Stacked widgets were missing a --small, --medium, --large widget modifier class
- ORBIT-161 - Siteimprove fix: Favicons on branding page - alt text contains the filename
- ORBIT-253 - Homepages - supplement are full width
- ORBIT-202 - Container issue on two column homepages
- ORBIT-256 - Outline focus for links within boxed elements
- ORBIT-248 - Added new grey var and changed default text colour to pass colour contrast
- ORBIT-233 - Border colour for radio buttons when selected
- ORBIT-229 - back to top button overlapping copyright text
- ORBIT-227 - header logo and buttons hover
- ORBIT-279 - amend aside margin and last child within page content
- ORBIT-263 - darken placeholder text colour
- ORBIT-273 - hide announcement on print
- ORBIT-270 - remove back to top from offline page
- ORBIT-271 - remove skip links from offline page
- ORBIT-269 - fix non-wrapping checkbox labels
- ORBIT-275 - Directories - Table out of line with label
- ORBIT-262 - Directories - spacing issue
- ORBIT-258 - Fix skip map button functionality
- ORBIT-250 - Documents - images shrinking in size when captions are used
- ORBIT-215 - Social media links not showing on prototype

### Removed
- SPC-49410 – .menu-is-open class was causing a CSS conflict on the document page
- ORBIT-257 -  Removed swfobject form certain twig files


## [2.0.0] - 30-05-2019

### Changed
- Photonised Orbit, and restructured completely
