Welcome to the Orbit Framework. A simple framework designed to bridge the gap between prototypes, style guides, mockups and site builds. Note that there are still many things to be added to Orbit and as such it should be treated as a *work in progress*.

Orbit is based on our internal OOCSS policy and is Coding Standards compliant. It has lots of nifty features like a fluid grid system, mobile–first responsive patterns, a simple interaction framework and all the objects you'll need as part of a standard Jadu build.

The idea of Orbit is to make a site build a trivial process, with clever use of Sass it can be used just as easily as a rapid prototyping tool as it can a complete, OOCSS framework for mockups and style guides. Out of the box Orbit provides the basic styling required for wireframing.

Everything from the grid system to the colours is Sass–driven and makes clever use of sensible defaults, colours can be overwritten in a single file and propogated throughout the site, typography too, everything from line-height to font-size can be edited in a single file and propogated throughout the site.

Check the sidebar menu and below for more details.


## Getting started - Installing required packages & libraries

Orbit requires some additional packages to be installed before it'll work, you can install all dependencies by typing the following command in the Orbit directory (note ruby and sass must already be installed - *this needs to be built into the process*):

    $ make

Note you must have xCode installed for `make` to function

You can define new front-end libraries in `bower.json`. Re-running the make command will bring these into Orbit, alternatively you could run  

    $ bower install

From the Orbit directory

You can reverse the make process by using:

    $ sudo make clean


## Helpful build tasks

Orbit also includes some nice grunt tasks to make your workflow a little easier. Once the `make` process has completed you can run

    $ grunt

This will:

* Concatinate all JavaScript files in the /js directory (the order can be configured in the grunt task)
* Minify the concatinated JavaScript and out put it to a single file in /dist
* Run all Sass thorough the Sass linter to ensure your code adheres to our Coding Standards 
* Watch and compile your Sass to CSS
* Runs compiled CSS through autoprefixer to help avoid missing any vendor prefixes (you can actually write your sass with just the latest css3 and the prefixer will add the required vendor prefixes to your outputted CSS)
* Updates the docs with your new styles
* Spins up a localhost specific to the Orbit directory

When your project is complete you can run

    $ grunt prod

which will prepare your code for production usage by doing the following:

* Concatinate all JavaScript files in the /js directory
* Minify the concatinated JavaScript and out put it to a single file in /dist
* Run all Sass thorough the Sass linter to ensure your code adheres to our Coding Standards 
* Compiles your sass and removes line numbers / comments.
* Runs compiled CSS through autoprefixer
* Updates the docs with your new styles
* Deletes the Sass cache


## Included libraries

Orbit uses [Bower](http://bower.io/) to pull in some common used libraries which can all be found in the /libs directory. These include:

* jQuery
* Font Awesome (Default version of 3.2.1)
* html5shiv
* ie9-js (makes IE7 & 8 behave more like IE9)
* [matchMedia polyfill](https://github.com/paulirish/matchMedia.js/) (adds media query support for JS)
* [modernizr](http://modernizr.com/) a JavaScript library that detects HTML5 and CSS3 features in the user’s browser
* [placeholder.js](https://github.com/jamesallardice/Placeholders.js/) adds HTML5 placeholder atribute support for older browsers
* [Susy](http://susydocs.oddbird.net/en/latest/) a truly awesome grid toolkit


## Documentation

Orbits` docs can be found at /docs. The sass files are heavily commented too.

The docs are built into the default grunt task, meaning as you change Orbit and add your own style to suit your project the docs will change to reflect your changes, giving you a *auto generated, living styleguide*

You can also details about your own styling to the styleguide by using KSS style comment blocks (http://warpspire.com/kss/).



## JS guideines:

All JS should only be included from the /libs and /dist folders not from the unminified /js folder.  



## CSS guideines:

### General 
* Never style ID's and .js- classes
* Use short-hand notation where possible
* Keep nesting to a minimum, and no deeper than 4 levels, including pseudo selectors (:nth-of-type and :after)
* Rule sets should be ordered as follows: @extend declarations, @include declarations without inner @content, properties, @include declarations with inner @content, then nested rule sets.
* Orbit follows a BEM (Block element modifier) naming convention. Whilst it can seem confusing at first, BEM allows you to remove potential speficity issues and gives you instantly understandable markup.  You can read more here: http://csswizardry.com/2013/01/mindbemding-getting-your-head-round-bem-syntax/
* Using BEM should avoid things like .navigation ul li a, instead you should have .navigation and .navigation--link. This helps no end with specificity 
* Don't be clever with selectors. Aim for readability over complexity
* All styling should be mobile first and add aditional breakpoint styling using min-widths MQ (using the Orbit mixins)
* All colours should be set in their own varible and lightened/darkened using the sass functions as needed.
* All margins and padding should be set using the `rem()` mixin and the $space varibles where possible for vertical and horizontal consistency. The `rem()` mixin also provides px fallbacks for older browsers.

### BEM

BEM – meaning block, element, modifier – is a front-end naming methodology thought up by the guys at Yandex. It is a smart way of naming your CSS classes to give them more transparency and meaning to other developers. They are far more strict and informative, which makes the BEM naming convention ideal for teams of developers on larger projects that might last a while.

It is important to note that we use a naming scheme based on BEM, but honed by Nicolas Gallagher and made popular by Harry Roberts. The naming convention used in Orbit are not the original BEM ones, but are improved versions that are more commonly prefered. 

The naming convention follows this pattern:

    .block {}
    .block__element {}
    .block--modifier {} / .block__element--modifier {}

* .block represents the higher level of an abstraction or component.
* .block__element represents a descendent of .block that helps form .block as a whole.
* .block--modifier represents a different state of .block.
* .block__element--modifier represents a differe state of .block__element

The reason for double rather than single hyphens and underscores is so that your block itself can be hyphen delimited, for example:

    .site-search {} /* Block */
    .site-search__field {} /* Element */
    .site-search--full {} /* Modifier */
    .site-search__field--error {} /* Modifier */

The important thing to remember is a group of elements only becomes a BEM block when it has associated elements within it that follow BEM naming conventions. Otherwise it’s just a class that doesn’t fall into any BEM category.

Take for example:

    .caps { text-transform: uppercase; }

This CSS would never fall into any BEM category, it’s merely a standalone rule.

Another example of code which isn’t BEM:

    .site-logo {}

Here we have our logo; it could be BEMmed up like so:

    .header {}
    .header__logo {}

But that is unecessary. The trick with BEM is knowing when something falls into a relevant category. Just because something happens to live inside a block it doesn’t always mean is is actually a BEM element. In the case of our site logo it lives in the .header purely coincidentally; it could just as easily be in our sidebar or footer. An element’s scope can start in any context, so you need to make sure you only apply BEM as far as you need to. Another example:

    <div class="content">
        <h1 class="content__headline">Lorem ipsum dolor...</h1>
    </div>

Here we might be able to just call the second class .headline; it depends on if it is styled that way because it’s in .content, or whether it just happens to live in .content. If it is the latter then we do not need BEM.

Everything is potentially open to moving into BEM territory, though. Taking our .site-logo example again, imagine that we want to have a festive version of the logo for our Christmassy site design. We could have:

    .site-logo {}
    .site-logo--xmas {}

We can quickly build variations of things by using the -- modifier notation.

One of the hardest parts of BEM is deciding when to start and stop scope, and when (or not) to use it. It’s a case of ‘you’ll just know when you know’.

You can read more on BEM here: http://csswizardry.com/2013/01/mindbemding-getting-your-head-round-bem-syntax/

### Sass linting
The default grunt task runs all files in the /Sass/ folder through a Sass linter to check for compiance with our coding standards. This helps keep code consistant across projects and developer.

### Sass lint rules
All Sass is run against the following rules. You'll need to ensure your code meets the below criteria or errors will be shown in terminal and Sass won't compile to CSS.

#### BangFormat:

Reports when you use improper spacing around ! (the "bang") in !important and !default declarations.

You can prefer a single space or no space both before and after the !.

Bad

    color: #000!important;
Good

    color: #000 !important;

#### BorderZero:

Prefer `border: 0` over `border: none`.

#### CapitalizationInSelector:

Checks for capitalized letters in IDs, classes, types, etc. in selectors.

#### ColorKeyword:

Prefer hexadecimal color codes over color keywords.

Bad: color keyword

    color: green;
Good: hexadecimal color

    color: #0f0;

Defining colors directly in properties is usually a smell. When you color your body text in a number of places, if you ever want to change the color of the text you'll have to update the explicitly defined color in a number of places, and finding all those places can be difficult if you use the same color for other elements (i.e. a simple find/replace may not always work).

A better approach is to use global variables like $color-text-body and refer to this variable everywhere you want to use it. This makes it easy to update the color, as you only need change it in one place. It is also more intention-revealing, as seeing the name $color-text-body is more descriptive than #333 or black. Using color keywords can obfuscate this, as they look like variables.

#### DebugStatement:

Reports `@debug` statements (which you probably left behind accidentally).

#### DeclarationOrder:

Rule sets should be ordered as follows: @extend declarations, @include declarations without inner @content, properties, @include declarations with inner @content, then nested rule sets.

Bad

    .fatal-error {
      p {
        ...
      }

      color: #f00;
      @extend %error;
      @include message-box();
    }
Good

    .fatal-error {
      @extend %error;
      @include message-box();
      color: #f00;

      p {
        ...
      }
}
The @extend statement functionally acts like an inheritance mechanism, which means the properties defined by the placeholder being extended are rendered before the rest of the properties in the rule set.

Thus, declaring the @extend at the top of the rule set reminds the developer of this behavior.

Placing @include declarations without inner @content before properties serves to group them with @extend declarations and provides the opportunity to overwrite them later in the rule set.

@includes with inner @content often involve @media rules that rely on the cascade or nested rule sets, which justifies their inclusion after regular properties.

Mixin @content and nested rule sets are also linted for declaration order.

#### EmptyLineBetweenBlocks:

Separate rule, function, and mixin declarations with empty lines.

Bad: no lines separating blocks

    p {
      margin: 0;
      em {
        ...
      }
    }
a {
  ...
}
Good: lines separating blocks

    p {
      margin: 0;

      em {
        ...
      }
    }

    a {
      ...
    }

#### FinalNewline:

Files should always have a final newline. This results in better diffs when adding lines to the file, since SCM systems such as git won't think that you touched the last line.

#### HexNotation:

Checks if hexadecimal colors are written in lowercase. 

#### HexValidation:

Ensure hexadecimal colors are valid (either three or six digits).

Bad

    p {
      background: #ab; // Clearly a typo
    }
Good

    p {
      background: #abc;
    }

#### IdWithExtraneousSelector:

Checks for a selector with an ID combined with some other selector. ID's should never be used for styling purposes.

#### Indentation:

Use four spaces per indentation level.

Bad: two spaces

    p {
      color: #f00;
    }
Good: four spaces

    p {
        color: #f00;
    }

#### LeadingZero:

Don't write leading zeros for numeric values with a decimal point.

Bad: unnecessary leading zero

    margin: 0.5em;
Good: no leading zero

    margin: .5em;

#### PropertySortOrder:

Require CSS properties be sorted in alphabetical order. If you need to write vendor-prefixed properties, the linter will allow you to order the vendor-prefixed properties before the standard CSS property they apply to.

#### PropertySpelling:

Reports when you use an unknown CSS property (ignoring vendor-prefixed properties). Since the list of available CSS properties is constantly changing, it's possible that you might get some false positives here, especially if you're using experimental CSS features. If that's the case, you can add additional properties to the whitelist by adding the following to your .scss-lint.yml configuration:

    PropertySpelling:
        enabled: true
        extra_properties: 
         - '*zoom'

#### SelectorDepth:

Don't write selectors with a depth of applicability greater than 4.

#### SelectorFormat:

Check class names are using the BEM syntax

#### Shorthand:

Prefer the shortest shorthand form possible for properties that support it.

Bad: all 4 sides specified with same value

    margin: 1px 1px 1px 1px;
Good: equivalent to specifying 1px for all sides

    margin: 1px;

#### SingleLinePerSelector:

Properties within rule sets should each reside on their own line.

Bad

    p {
      margin: 0; padding: 0;
    }
Good

    p {
      margin: 0;
      padding: 0;
    }
A special exception is made for single line rule sets. For example the following is acceptable:

    p { margin: 0; padding: 0; }

#### SpaceAfterComma:

Commas in lists should be followed by a space.

Bad: no space after commas

    @include box-shadow(0 2px 2px rgba(0,0,0,.2));
    color: rgba(0,0,0,.1);
Good: commas followed by a space

    @include box-shadow(0 2px 2px rgba(0, 0, 0, .2));
    color: rgba(0, 0, 0, .1);

#### SpaceAfterPropertyColon:

Properties should be formatted with a single space separating the colon from the property's value.

Bad: no space after colon

    margin:0;
Bad: more than one space after colon

    margin:  0;
Good

    margin: 0;

#### SpaceAfterPropertyName:

Properties should be formatted with no space between the name and the colon.

Bad: space before colon

    margin : 0;
Good

    margin: 0;

#### SpaceBeforeBrace:

Opening braces should be preceded by a single space.

Bad: no space before brace

    p{
      ...
    }
Bad: more than one space before brace

    p  {
      ...
    }
Good

    p {
      ...
    }

#### SpaceBetweenParens:

Parentheses should not be padded with spaces.

Bad

    @include box-shadow( 0 2px 2px rgba( 0, 0, 0, .2 ) );
    color: rgba( 0, 0, 0, .1 );
Good

    @include box-shadow(0 2px 2px rgba(0, 0, 0, .2));
    color: rgba(0, 0, 0, .1);

#### StringQuotes:

String literals should be written with single quotes unless using double quotes would save on escape characters.

Bad: double quotes

    content: "hello";
Good: single quotes

    content: 'hello';
Good: double quotes prevent the need for escaping single quotes

    content: "'hello'";
Single quotes are easier to type by virtue of not requiring the Shift key on most popular keyboard layouts.

#### TrailingSemicolonAfterPropertyValue:

Property values; @extend, @include, and @import directives; and variable declarations should always end with a semicolon.

#### UnnecessaryMantissa:

Numeric values should not contain unnecessary fractional portions.

Bad

    margin: 1.0em;
Good

    margin: 1em;

#### UrlFormat:

URLs should not contain protocols or domain names.

Including protocols or domains in URLs makes them brittle to change, and also unnecessarily increases the size of your CSS documents, reducing performance.

Bad: protocol and domain present

    background: url('https://example.com/assets/image.png');
Good

    background: url('assets/image.png');

#### UrlQuotes:

URLs should always be enclosed within quotes.

Bad: no enclosing quotes

    background: url(example.png);
Good

    background: url('example.png');
Using quoted URLs is consistent with using other Sass asset helpers, which also expect quoted strings. It also works better with most syntax highlighters, and makes it easier to escape characters, as the escape rules for strings apply, rather than the different set of rules for literal URLs.

#### ZeroUnit:

Omit length units on zero values.

Bad: unnecessary units

    margin: 0px;
Good

    margin: 0;
Zero is zero regardless of the units of length.


## Media Queries
Media queries should be done inline within the class using the built in mixin (which includes fix widths fallbacks for < IE8). For example:

    .navigation {
        width: 100%;

        @include respond-min($small-width) {
            width: 50%;
        }
    }


## Comments
Remember "Code Tells You How, Comments Tell You Why" - Jeff Atwood.
If any CSS you write is not immediately obvious in context, it should be commented - not explaining how it works, but why its there in the first place. Ideally, add your styling to the 
styleguide by using KSS style comment blocks (http://warpspire.com/kss/). Comments are removed from complied CSS when `grunt prod` is ran.


## Autoprefixer
Orbit makes use of Autoprefixer, a Post Processor which allows you to write your CSS rules without vendor prefixes. Just write normal CSS according to the latest W3C specs and Autoprefixer will produce the code for old browsers in your compiled CSS.

For example:

    a {
        display: flex;
    }
compiles to:

    a {
        display: -webkit-box;
        display: -webkit-flex;
        display: -moz-box;
        display: -ms-flexbox;
        display: flex
    }

You can read more about Autoprefixer here: https://github.com/postcss/autoprefixer


## Pre-Processor
We use Libsass for Sass compilation, mainly due to the speed of compilation if affords. Bear in mind this does have some subtle differences to Ruby Sass.

