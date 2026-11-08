# Render alertmanager.tmpl.yml by substituting every ${ALERTMANAGER_*} placeholder
# with the matching environment variable (OBS-P3-005).
#
# The previous one-liner used awk gsub(): in a gsub() replacement string "&"
# expands to the matched text and "\" starts an escape sequence, so a webhook
# URL or password containing either character (plausible in generated secrets)
# produced a corrupted config and the Alertmanager container exited. The
# substitution below copies each value with index/substr, which has no
# replacement metacharacters.
#
# Every placeholder in the template sits inside a double-quoted YAML scalar, so
# the value is also escaped for that context (each backslash and double quote
# doubled): a literal backslash that reached the YAML parser as e.g. "\s" is an
# unknown escape and would fail config validation just like the awk bug did.
#
# Usage: awk -f render-alertmanager.awk alertmanager.tmpl.yml
function yaml_double_quote_escape(value,   out, i, c) {
  out = ""
  for (i = 1; i <= length(value); i++) {
    c = substr(value, i, 1)
    if (c == "\\" || c == "\"") {
      out = out "\\" c
    } else {
      out = out c
    }
  }
  return out
}

function substitute(line, placeholder, value,   idx, out) {
  out = ""
  while ((idx = index(line, placeholder)) > 0) {
    out = out substr(line, 1, idx - 1) value
    line = substr(line, idx + length(placeholder))
  }
  return out line
}

function indent_of(s,   i) {
  i = 0
  while (substr(s, i + 1, 1) == " ") {
    i++
  }
  return i
}

{
  # Optional-integration blocks: a marker line asks the renderer to drop the
  # parent YAML key and its children when the environment variable is empty.
  # Without this, an unset Slack URL forced the compose no-op loopback URL into
  # the receiver, so every notification also failed against
  # http://127.0.0.1:1/noop.
  #
  # Output is buffered one line so the parent (e.g. `slack_configs:`) can be
  # dropped when its marker arrives on the next line.
  if (skip_block) {
    if (length($0) == 0 || indent_of($0) > block_indent) {
      next
    }
    skip_block = 0
  }
  if ((marker = index($0, "# render:omit-if-empty ")) > 0) {
    var = substr($0, marker + length("# render:omit-if-empty "))
    space = index(var, " ")
    if (space > 0) {
      var = substr(var, 1, space - 1)
    }
    if (ENVIRON[var] == "") {
      block_indent = indent_of(pending_line)
      has_pending = 0
      skip_block = 1
      next
    }
    next
  }

  line = $0
  line = substitute(line, "${ALERTMANAGER_DEFAULT_WEBHOOK_URL}", yaml_double_quote_escape(ENVIRON["ALERTMANAGER_DEFAULT_WEBHOOK_URL"]))
  line = substitute(line, "${ALERTMANAGER_CRITICAL_WEBHOOK_URL}", yaml_double_quote_escape(ENVIRON["ALERTMANAGER_CRITICAL_WEBHOOK_URL"]))
  line = substitute(line, "${ALERTMANAGER_WEBHOOK_USER}", yaml_double_quote_escape(ENVIRON["ALERTMANAGER_WEBHOOK_USER"]))
  line = substitute(line, "${ALERTMANAGER_WEBHOOK_PASS}", yaml_double_quote_escape(ENVIRON["ALERTMANAGER_WEBHOOK_PASS"]))
  line = substitute(line, "${ALERTMANAGER_WATCHDOG_WEBHOOK_URL}", yaml_double_quote_escape(ENVIRON["ALERTMANAGER_WATCHDOG_WEBHOOK_URL"]))
  line = substitute(line, "${ALERTMANAGER_SLACK_API_URL}", yaml_double_quote_escape(ENVIRON["ALERTMANAGER_SLACK_API_URL"]))
  line = substitute(line, "${ALERTMANAGER_SLACK_CHANNEL}", yaml_double_quote_escape(ENVIRON["ALERTMANAGER_SLACK_CHANNEL"]))
  if (has_pending) {
    print pending_line
  }
  pending_line = line
  has_pending = 1
}

END {
  if (has_pending) {
    print pending_line
  }
}
