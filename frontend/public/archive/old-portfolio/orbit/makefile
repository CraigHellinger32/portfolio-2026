HR = \n---------------------------------------

greenOpen = \033[32m
redOpen = \033[31m
close = \033[39m

CHECK = ${greenOpen}✓${close}
CROSS = ${redOpen}✗${close}

BUILD := build

BREW     = $(shell which brew)
GULP     = $(shell which gulp)
NODE     = $(shell which node)
NPM      = $(shell which npm)
SASS     = $(shell which sass)
SASSLINT = $(shell which scss-lint)
XCODE    = $(shell pkgutil --pkg-info=com.apple.pkg.CLTools_Executables)

build:

# Install XCODE
ifeq (${XCODE}, )
	@ echo "${HR}\nInstalling XCode Command Line Tools...${HR}\n"
	xcode-select --install
else
	@ echo "${greenOpen}Command line tools${close} are already installed."
endif

# Install Homebrew
ifeq (${BREW}, )
	@ echo "${HR}\nInstalling Homebrew and its dependencies...${HR}\n"
	@ ruby -e "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
else
	@ echo "${greenOpen}Homebrew${close} is already installed."
endif

# Install Node
ifeq (${NODE}, )
	@ echo "${HR}\nInstalling Node...${HR}\n"
	brew install node
	sudo npm install -g npm
else
	@ echo "${greenOpen}Node${close} is already installed."
endif

# Install sass
ifeq (${SASS}, )
	@ echo "${HR}\nInstalling Sass and its dependencies...${HR}\n"
	@ sudo gem install sass -v 3.4.22
else
	@ echo "${greenOpen}Sass${close} is already installed."
endif

# Install scss_lint
ifeq (${SASS}, )
	@ echo "${HR}\nInstalling scsslint...${HR}\n"
	@ sudo gem install scss_lint -v 0.50.2
else
	@ echo "${greenOpen}Scss-Lint${close} is already installed."
endif

# Install Gulp
ifeq (${GULP}, )
	@ echo "${HR}\nInstalling Gulp...${HR}\n"
	@ sudo npm install -g gulp-cli
else
	@ echo "${greenOpen}Gulp${close} is already installed."
endif

# Install NPM dependencies
	@ echo "${HR}\nInstalling packages...${HR}"
	@ npm install

# Run gulp workflow
	@ echo "${HR}\nRunning the first build${HR}"
	@ echo "${greenOpen}gulp build --prod${close}${HR}"
	@ gulp build --prod
	@ echo "${HR}\n${CHECK} Done\n"

# Gulp Help
	@ gulp help
	@ echo "Run ${greenOpen}gulp${close} to start Orbit in dev mode.${HR}"

clean:
	@ echo "${HEADER}"
	@ echo "${HR}\nRemoving front-end libraries...${HR}"
	@ rm -rf node_modules/
	@ echo "\n${CHECK} Done\n"
	@ echo "${HR}\nVerifying cache and garbage collection${HR}"
	@ npm cache verify
	@ echo "\n${CHECK} Done\n"

version:
	@ echo "${HR}"
	@ echo "BREW         $(shell brew --version) ${HR}"
	@ echo "SASS         $(shell sass --version) ${HR}"
	@ echo "SCSS-LINT    $(shell scss-lint --version) ${HR}"
	@ echo "GULP         $(shell gulp --version) ${HR}"
	@ echo "NODE         $(shell node --version) ${HR}"
	@ echo "NPM          $(shell npm --version) ${HR}"
