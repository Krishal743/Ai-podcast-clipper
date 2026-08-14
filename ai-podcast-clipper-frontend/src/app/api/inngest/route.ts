import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processVideo } from "../../../inngest/functions";

// Create an API that serves the process-video function
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processVideo],
});