FROM node:18-alpine

WORKDIR /app

# copy package files first (layer caching)
COPY package*.json ./

# install only production deps
RUN npm ci 

# copy source
COPY index.js .

# non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "index.js"]