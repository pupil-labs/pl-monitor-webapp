import {
  Message,
  Tube,
  MessageType,
  payloadType,
  payload,
} from "media-stream-library";
import { CustomMessageType, CustomMessage } from "./message";

const stream_browserify = require("stream-browserify");
const Transform = stream_browserify.Transform;

export class GazeDepay extends Tube {
  constructor() {
    let RTPPayloadType: number;
    const incoming = new Transform({
      objectMode: true,
      transform: function (
        msg: Message | CustomMessage,
        encoding: any,
        callback: any
      ) {
        if (msg.type === MessageType.SDP) {
          let validMedia;
          for (const media of msg.sdp.media) {
            if (
              media.type === "application" &&
              media.rtpmap &&
              media.rtpmap.encodingName === "COM.PUPILLABS.GAZE1"
            ) {
              validMedia = media;
            }
          }
          if (validMedia && validMedia.rtpmap) {
            RTPPayloadType = Number(validMedia.rtpmap.payloadType);
          }
          callback(undefined, msg);
        } else if (
          msg.type === MessageType.RTP &&
          payloadType(msg.data) === RTPPayloadType
        ) {
          let msgBuffer = payload(msg.data);
          var x = msgBuffer.readFloatBE(0);
          var y = msgBuffer.readFloatBE(4);
          var worn = msgBuffer.readInt8(8);
          const gazeMsg: CustomMessage = {
            ntpTimestamp: msg.ntpTimestamp,
            payloadType: payloadType(msg.data),
            data: msg.data,
            type: CustomMessageType.GAZE,
            gazePoint: { x: x, y: y, worn: worn },
          };
          callback(undefined, gazeMsg);
        } else {
          // Not a message we should handle
          callback(undefined, msg);
        }
      },
    });

    // outgoing will be defaulted to a PassThrough stream
    super(incoming);
  }
}
