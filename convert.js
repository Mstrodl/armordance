function parse(data) {
  const lines = data.split("\n");
  const frames = [];
  let values = {};
  for (const line of lines) {
    // Frame ctr
    if (!isNaN(line)) {
      values.__index = frames.length;
      frames.push(values);
      values = {};
    } else {
      const tokens = line.split(" ");
      const key = tokens.shift();
      if (tokens.length == 1) {
        values[key] = {
          x: Number(tokens[0]),
        };
      } else if (tokens.length == 2) {
        values[key] = {
          x: Number(tokens[0]),
          y: Number(tokens[1]),
        };
      } else if (tokens.length == 3) {
        values[key] = {
          x: Number(tokens[0]),
          y: Number(tokens[1]),
          z: Number(tokens[2]),
        };
      } else {
        values[key] = {
          tokens,
        };
      }
    }
  }

  return frames;
}

const bvhParse = require("bvh-parser");
function parseBVH(bvhData) {
  const data = bvhParse(bvhData);
  const frames = [];
  let idx = 0;
  for (const frameData of data.frames) {
    // if (++idx & 1) continue;
    const frame = {};
    for (const joint of data.joints) {
      const jointName =
        joint.name == "Center"
          ? "Pelvis"
          : joint.name.startsWith("ValveBiped.Bip01_")
          ? joint.name.substring(17)
          : joint.name;
      frame[jointName] = {};
      for (const channelIndex in joint.channels) {
        frame[jointName][joint.channels[channelIndex]] =
          frameData[joint.channelOffset + Number(channelIndex)];
      }
    }
    frames.push(frame);
  }
  return frames;
}

// {LeftLeg: [79.0f, 255.0f, 79.0f], Head: [71.0f, 90.0f, 109.0f], RightLeg: [146.0f, 165.0f, 94.0f], Body: [34.0f, 165.0f, 330.0f]}
function convert(frames) {
  frames = frames.concat(Array.from(frames).reverse());
  const commandFrames = [];
  let prevPelvis = frames[frames.length - 1].Pelvis;
  for (const frameIndex in frames) {
    const frame = frames[frameIndex];
    commandFrames.push([
      `/data modify entity @s Pose set value {LeftLeg: [${
        frame.L_Calf.Zrotation - 45
      }f, ${frame.L_Calf.Yrotation}f, ${frame.L_Calf.Xrotation}f], RightLeg: [${
        frame.R_Calf.Zrotation - 45
      }f, ${frame.R_Calf.Yrotation}f, ${frame.R_Calf.Xrotation}f], Head: [${
        frame.Head1.Zrotation
      }f, ${frame.Head1.Yrotation}f, ${frame.Head1.Xrotation}f], Body: [${
        frame.Spine2.Zrotation
      }f, ${frame.Spine2.Yrotation}f, ${frame.Spine2.Xrotation}f], RightArm: [${
        frame.R_Forearm.Zrotation
      }f, ${frame.R_Forearm.Yrotation}f, ${
        frame.R_Forearm.Xrotation
      }f], LeftArm: [${frame.L_Forearm.Zrotation}f, ${
        frame.L_Forearm.Yrotation
      }f, ${frame.L_Forearm.Xrotation}f]}`,
      `/data modify entity @s Rotation set value [${frame.Pelvis.Yrotation}f]`,
      {
        interpolate: false,
        code: `/tp @s ~${
          (frame.Pelvis.Xposition - prevPelvis.Xposition) / 12
        } ~${(frame.Pelvis.Zposition - prevPelvis.Zposition) / 12} ~${
          (frame.Pelvis.Yposition - prevPelvis.Yposition) / 12
        }`,
      },
    ]);
    prevPelvis = frame.Pelvis;
  }
  return commandFrames;
}
module.exports = {convert, parse, parseBVH};
