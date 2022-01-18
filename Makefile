#!make
NPX := npx
JEST := $(NPX) jest --runInBand
WEBPACK := NODE_OPTIONS="--max-old-space-size=8192" $(NPX) webpack
PRETTIER := $(NPX) prettier
ESLINT := $(NPX) eslint
LERNA := $(NPX) lerna
TAP := NODE_OPTIONS="-r ts-node/register" $(NPX) tap -Rspec --timeout=300
TSNODE := $(NPX) ts-node

.PHONY: install ## install dependencies
install:
	npm ci

.PHONY: clean ## remove all generated files
clean: clean-node-modules clean-cache clean-test clean-build

.PHONY: clean-node-modules ### remove all node_modules
clean-node-modules:
	rm -rfv node_modules packages/*/node_modules

.PHONY: clean-cache ### remove all caches
clean-cache:
	rm -rfv .eslintcache

.PHONY: clean-test ### remove all test output
clean-test:
	rm -rfv test-results

.PHONY: clean-build ### remove all build files
clean-build: clean-build-packages clean-build-cli

.PHONY: clean-build-packages ### remove packages build files
clean-build-packages:
	rm -rfv packages/*/dist packages/*/tsconfig.tsbuildinfo packages/*/*.tgz

.PHONY: clean-build-cli ### remove cli build files
clean-build-cli:
	rm -rfv dist tsconfig.tsbuildinfo *.tgz binary-releases pysrc

.PHONY: format ## format all files
format:
	$(PRETTIER) --write '**/*.{js,ts,json,yaml,yml,md}'

.PHONY: format-changes ### format changed files
format-changes:
	./scripts/format/prettier-changes.sh

.PHONY: lint ## check files for issues
lint: lint-eslint lint-prettier

.PHONY: lint-eslint ### check js/ts files for issues
lint-eslint:
	$(ESLINT) --quiet --color --cache '**/*.{js,ts}'

.PHONY: lint-prettier ### check files for formatting issues
lint-prettier:
	$(PRETTIER) --check '**/*.{js,ts,json,yaml,yml,md}'

.PHONY: lint-build-environment ### check build environment for issues
lint-build-environment:
	$(TSNODE) ./scripts/check-dev-environment.ts

.PHONY: build ## build packages and cli for development
build: lint-build-environment build-dev

.PHONY: build-dev ### build packages and cli for development
build-dev: build-packages build-cli-dev

.PHONY: build-prod ### build packages and cli for production
build-prod: build-packages build-cli-prod

.PHONY: build-packages ### build packages
build-packages: clean-build-packages
	$(LERNA) run build --ignore snyk

.PHONY: build-cli-dev ### build cli for development
build-cli-dev: clean-build-cli
	$(WEBPACK) --config webpack.dev.ts

.PHONY: build-cli-prod ### build cli for production
build-cli-prod: clean-build-cli
	$(WEBPACK) --config webpack.prod.ts

.PHONY: watch ## automatically rebuild when cli sources are changed
watch: build-packages clean-build-cli
	$(WEBPACK) --config webpack.dev.ts --watch

.PHONY: test ## run all tests
test: test-root test-unit test-system test-acceptance test-packages-unit test-packages-acceptance test-tap

.PHONY: test-root ### run cli tests at root level
test-root: clean-test
	$(JEST) '/test/[^/]+\.spec\.ts'

.PHONY: test-unit ### run cli unit tests
test-unit: clean-test
	$(JEST) '/test/jest/unit/(.+/)*[^/]+\.spec\.ts'

.PHONY: test-system ### run cli system tests
test-system: clean-test
	$(JEST) '/test/jest/system/(.+/)*[^/]+\.spec\.ts'

.PHONY: test-acceptance ### run cli acceptance tests
test-acceptance: clean-test
	$(JEST) '/test/jest/acceptance/(.+/)*[^/]+\.spec\.ts'

.PHONY: test-packages-unit ### run unit tests in packages
test-packages-unit: clean-test
	$(JEST) '/packages/.+/test/unit/(.+/)*[^/]+\.spec\.ts'

.PHONY: test-packages-acceptance ### run acceptance tests in packages
test-packages-acceptance: clean-test
	$(JEST) '/packages/.+/test/acceptance/(.+/)*[^/]+\.spec\.ts'

.PHONY: test-tap ### run deprecated cli tap tests
test-tap: clean-test
	$(TAP) test/tap/*.test.*

.PHONY: test-smoke ### run cli smoke tests
test-smoke: clean-test
	./scripts/run-smoke-tests-locally.sh

.PHONY: help
help:
	@echo 'Usage: make <target>'
	@echo
	@echo 'The available targets are listed below.'
	@echo 'The primary workflow commands are given first,'
	@echo 'followed by less common or more advanced commands.'
	@echo 'For general help using "make", run `man make`.'
	@echo
	@echo 'Main targets:'
	@grep -E '^\.PHONY: [a-zA-Z_-]+ ## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = "(: | ## )"}; {printf "  \033[36m%-25s\033[0m %s\n", $$2, $$3}'
	@echo
	@echo 'All other targets:'
	@grep -E '^\.PHONY: [a-zA-Z_-]+ ### .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = "(: | ### )"}; {printf "  \033[34m%-25s\033[0m %s\n", $$2, $$3}'
