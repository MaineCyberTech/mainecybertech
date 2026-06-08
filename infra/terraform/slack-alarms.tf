data "archive_file" "slack_notifier" {
  type        = "zip"
  output_path = "${path.module}/lambda/slack-notifier.zip"

  source {
    content  = <<-EOT
const https = require("https");

exports.handler = async (event) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("SLACK_WEBHOOK_URL not set; skipping");
    return;
  }

  const snsMessage = JSON.parse(event.Records[0].Sns.Message);
  const alarmName = snsMessage.AlarmName || "Unknown";
  const newState = snsMessage.NewStateValue || "UNKNOWN";
  const reason = snsMessage.NewStateReason || "";
  const region = event.Records[0].awsRegion || "us-east-1";
  const accountId = event.Records[0].Sns.TopicArn.split(":")[4] || "unknown";

  const colors = { ALARM: "danger", OK: "good", INSUFFICIENT_DATA: "warning" };
  const color = colors[newState] || "warning";
  const emoji = newState === "ALARM" ? ":fire:" : newState === "OK" ? ":white_check_mark:" : ":warning:";

  const payload = JSON.stringify({
    attachments: [{
      color,
      title: `$${emoji} CloudWatch Alarm: $${alarmName}`,
      fields: [
        { title: "State", value: newState, short: true },
        { title: "Region", value: region, short: true },
        { title: "Account", value: accountId, short: true },
        { title: "Reason", value: reason, short: false },
      ],
      footer: "Maine CyberTech Monitor",
      ts: Math.floor(Date.now() / 1000),
    }],
  });

  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => { console.log("Slack response:", body); resolve(); });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};
EOT
    filename = "index.js"
  }
}

resource "aws_iam_role" "slack_notifier" {
  name = "${local.alarm_prefix}-slack-notifier"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })

  tags = { Environment = var.environment }
}

resource "aws_iam_role_policy_attachment" "slack_notifier_basic" {
  role       = aws_iam_role.slack_notifier.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "slack_notifier" {
  count            = var.slack_webhook_url != "" ? 1 : 0
  filename         = data.archive_file.slack_notifier.output_path
  function_name    = "${local.alarm_prefix}-slack-notifier"
  role             = aws_iam_role.slack_notifier.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.slack_notifier.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      SLACK_WEBHOOK_URL = var.slack_webhook_url
    }
  }

  tags = { Environment = var.environment }
}

resource "aws_lambda_permission" "slack_notifier_sns" {
  count         = var.slack_webhook_url != "" ? 1 : 0
  statement_id  = "AllowSNSTopic"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack_notifier[0].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alarms.arn
}

resource "aws_sns_topic_subscription" "slack_notifier" {
  count      = var.slack_webhook_url != "" ? 1 : 0
  topic_arn  = aws_sns_topic.alarms.arn
  protocol   = "lambda"
  endpoint   = aws_lambda_function.slack_notifier[0].arn
}
