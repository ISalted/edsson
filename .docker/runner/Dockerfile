# Self-hosted GitHub Actions runner with Playwright pre-baked.
# Based on myoung34/github-runner (keeps its proven PAT auto-registration) and
# bakes Node + Google Chrome + system deps so CI jobs skip "Install Chrome".
#
# Build on the server:
#   docker build -t edsson-runner-pw:latest .docker/runner
# Then point a Portainer stack at image `edsson-runner-pw:latest`.
FROM myoung34/github-runner:latest

# Shared, world-readable browser path so jobs find browsers regardless of user.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

USER root

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 # bake Playwright browsers (Google Chrome channel) + their OS deps
 && npx -y playwright@1.49.0 install --with-deps chrome \
 && chmod -R a+rx /ms-playwright \
 && apt-get clean && rm -rf /var/lib/apt/lists/*
