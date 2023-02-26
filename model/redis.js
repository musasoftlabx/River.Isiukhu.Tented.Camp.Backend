const Redis = require("ioredis");

const redis = new Redis({
  host: "redis-17323.c250.eu-central-1-1.ec2.cloud.redislabs.com",
  port: 17323,
  password: "wakio5WkB8etEEJH9pIctFuTRlLrOodO",
});

redis.on("connect", () => {
  console.log("Redis connected");
});

module.exports = redis;
