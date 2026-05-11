FROM node:22-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY tsconfig.json handler.ts ./
RUN npx tsc

FROM public.ecr.aws/lambda/nodejs:22
COPY --from=builder /build/dist/ ./
COPY package*.json ./
RUN npm ci --omit=dev

# "handler" = compiled handler.js, "handler" = the exported function name
CMD ["handler.handler"]
