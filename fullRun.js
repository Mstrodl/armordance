const fs = require("fs");
const animation = fs.readFileSync("./untitled.bvh", "utf8");
const converter = require("./convert");
const lines = converter.convert(converter.parseBVH(animation));

for (const frameIndex in lines) {
  const frameData = lines[frameIndex]
    .map((cmd) => {
      if (typeof cmd == "string") {
        cmd = {
          interpolate: false,
          code: cmd,
        };
      }
      return cmd.code.substring(1);
    })
    .join("\n");

  fs.writeFileSync(
    `./template/data/dance/functions/frames/${frameIndex}.mcfunction`,
    frameData
  );
}

const commands = `execute as @e[type=armor_stand,tag=dance_stand] run execute at @s run function dance:armortick`;

fs.writeFileSync("./template/data/dance/functions/tick.mcfunction", commands);
const tickFunction = `scoreboard players set @s dance_frame_cnt 0
# Need to set the dance_speed objective if it's not set (and also enforce +int)
execute unless score @s dance_speed matches 0.. run scoreboard players set @s dance_speed 0

function dance:subtickworker`;

fs.writeFileSync(
  "./template/data/dance/functions/armortick.mcfunction",
  tickFunction
);

const subtick = `scoreboard players add @s dance_frame 1
execute if score @s dance_frame matches ${
  lines.length
}.. run scoreboard players set @s dance_frame 0

${lines
  .map(
    (cmd, index) =>
      `execute if score @s dance_frame matches ${index}..${index} run function dance:frames/${index}`
  )
  .join("\n")}

scoreboard players add @s dance_frame_cnt 1
execute unless score @s dance_frame_cnt > @s dance_speed at @s run function dance:subtickworker`;

fs.writeFileSync(
  "./template/data/dance/functions/subtickworker.mcfunction",
  subtick
);
