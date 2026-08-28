from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from datetime import datetime
import os
import smtplib
import logging
import traceback

contact_bp = Blueprint("contact", __name__)

# ── Module-level logger so messages always appear in terminal ─────────────────
logger = logging.getLogger("contact")
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


@contact_bp.route("/contact", methods=["POST"])
def send_contact_email():
    """
    Receives JSON from the contact form, validates it, and sends an email
    to the administrator via Flask-Mail (SMTP).
    Full diagnostic logging — no exception is suppressed.
    """

    # ── STEP 1: Request received ──────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("[CONTACT] ▶ POST /contact request received")

    data = request.get_json(silent=True)
    if not data:
        logger.error("[CONTACT] ✗ Invalid/empty JSON payload")
        return jsonify({"success": False, "error": "Invalid request payload."}), 400

    name    = (data.get("name",    "") or "").strip()
    email   = (data.get("email",   "") or "").strip()
    subject = (data.get("subject", "") or "").strip()
    message = (data.get("message", "") or "").strip()

    # ── STEP 2: Validation ────────────────────────────────────────────────────
    logger.info("[CONTACT] Validating fields...")
    missing = [f for f, v in [("Full Name", name), ("Email", email),
                               ("Subject", subject), ("Message", message)] if not v]
    if missing:
        logger.warning(f"[CONTACT] ✗ Validation failed — missing: {missing}")
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}."
        }), 422

    if "@" not in email or "." not in email.split("@")[-1]:
        logger.warning(f"[CONTACT] ✗ Invalid email format: {email!r}")
        return jsonify({"success": False, "error": "Invalid email address format."}), 422

    logger.info(f"[CONTACT] ✓ Validation passed | name={name!r} email={email!r} subject={subject!r}")

    # ── STEP 3: Read & log all SMTP env vars ─────────────────────────────────
    mail_server   = os.environ.get("MAIL_SERVER",   "smtp.gmail.com")
    mail_port     = os.environ.get("MAIL_PORT",     "587")
    mail_use_tls  = os.environ.get("MAIL_USE_TLS",  "True")
    mail_use_ssl  = os.environ.get("MAIL_USE_SSL",  "False")
    mail_username = os.environ.get("MAIL_USERNAME", "")
    mail_password = os.environ.get("MAIL_PASSWORD", "")
    admin_email   = os.environ.get("ADMIN_EMAIL",   "24205005@nec.edu.in")

    logger.info("[CONTACT] ── SMTP Config Dump ──────────────────────────")
    logger.info(f"  MAIL_SERVER         = {mail_server!r}")
    logger.info(f"  MAIL_PORT           = {mail_port!r}")
    logger.info(f"  MAIL_USE_TLS        = {mail_use_tls!r}")
    logger.info(f"  MAIL_USE_SSL        = {mail_use_ssl!r}")
    logger.info(f"  MAIL_USERNAME       = {mail_username!r}")
    logger.info(f"  MAIL_PASSWORD       = {'*' * len(mail_password) if mail_password else '(EMPTY)'}")
    logger.info(f"  MAIL_DEFAULT_SENDER = {current_app.config.get('MAIL_DEFAULT_SENDER')!r}")
    logger.info(f"  ADMIN_EMAIL         = {admin_email!r}")
    logger.info("────────────────────────────────────────────────────────")

    # ── STEP 4: Detect placeholder / empty credentials ────────────────────────
    placeholder_user = "your_sender_gmail@gmail.com"
    placeholder_pass = "your_16char_app_password"

    if not mail_username or mail_username == placeholder_user:
        err = (
            "MAIL_USERNAME is not configured. "
            "Open the .env file and set MAIL_USERNAME to your Gmail address."
        )
        logger.error(f"[CONTACT] ✗ {err}")
        return jsonify({"success": False, "error": err}), 500

    if not mail_password or mail_password == placeholder_pass:
        err = (
            "MAIL_PASSWORD is not configured. "
            "Open the .env file and set MAIL_PASSWORD to your Gmail App Password "
            "(generate one at https://myaccount.google.com/apppasswords)."
        )
        logger.error(f"[CONTACT] ✗ {err}")
        return jsonify({"success": False, "error": err}), 500

    # ── STEP 5: Verify SMTP connectivity before sending ───────────────────────
    port_int = int(mail_port)
    logger.info(f"[CONTACT] ▶ Testing SMTP connection → {mail_server}:{port_int} ...")
    try:
        if mail_use_ssl.lower() == "true":
            with smtplib.SMTP_SSL(mail_server, port_int, timeout=10) as smtp_test:
                smtp_test.ehlo()
                logger.info("[CONTACT] ✓ SMTP_SSL connection established")
        else:
            with smtplib.SMTP(mail_server, port_int, timeout=10) as smtp_test:
                smtp_test.ehlo()
                if mail_use_tls.lower() == "true":
                    smtp_test.starttls()
                    smtp_test.ehlo()
                logger.info("[CONTACT] ✓ SMTP connection + STARTTLS established")
    except Exception as conn_err:
        err_msg = f"Cannot connect to SMTP server {mail_server}:{port_int} — {type(conn_err).__name__}: {conn_err}"
        logger.error(f"[CONTACT] ✗ SMTP connectivity test FAILED: {err_msg}")
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"SMTP connection failed: {conn_err}"}), 500

    # ── STEP 6: Build email body ───────────────────────────────────────────────
    submitted_at = datetime.now().strftime("%d %B %Y, %I:%M %p")
    body = f"""\
--------------------------------------------------
New Feedback Received

Full Name:
{name}

Email Address:
{email}

Subject:
{subject}

Message:
{message}

Submitted At:
{submitted_at}
--------------------------------------------------

Sent from NEC AlgoViz Contact Form
"""

    # ── STEP 7: Send via Flask-Mail ───────────────────────────────────────────
    try:
        mail = current_app.extensions.get("mail")
        if mail is None:
            raise RuntimeError(
                "Flask-Mail extension is not registered on the app. "
                "Ensure Mail(app) is called in run.py."
            )

        logger.info(f"[CONTACT] ▶ Sending email via Flask-Mail → recipient: {admin_email!r}")

        msg = Message(
            subject="New Feedback Received - NEC AlgoViz",
            recipients=[admin_email],
            body=body,
            reply_to=email,
        )
        mail.send(msg)

        logger.info(f"[CONTACT] ✓ Email sent successfully → {admin_email}")
        logger.info("=" * 60)
        return jsonify({"success": True}), 200

    except smtplib.SMTPAuthenticationError as auth_err:
        tb = traceback.format_exc()
        err_msg = (
            f"SMTP Authentication failed for {mail_username!r}. "
            "If using Gmail, make sure you are using a 16-character App Password "
            "(NOT your regular Gmail password). "
            f"SMTP error: {auth_err}"
        )
        logger.error(f"[CONTACT] ✗ SMTPAuthenticationError: {err_msg}")
        logger.error(tb)
        return jsonify({"success": False, "error": err_msg}), 500

    except smtplib.SMTPRecipientsRefused as refused_err:
        tb = traceback.format_exc()
        logger.error(f"[CONTACT] ✗ SMTPRecipientsRefused: {refused_err}")
        logger.error(tb)
        return jsonify({"success": False,
                        "error": f"Recipient address refused by server: {refused_err}"}), 500

    except smtplib.SMTPException as smtp_err:
        tb = traceback.format_exc()
        logger.error(f"[CONTACT] ✗ SMTPException: {smtp_err}")
        logger.error(tb)
        return jsonify({"success": False,
                        "error": f"SMTP error: {smtp_err}"}), 500

    except Exception as exc:
        tb = traceback.format_exc()
        logger.error(f"[CONTACT] ✗ Unexpected error: {type(exc).__name__}: {exc}")
        logger.error(tb)
        return jsonify({"success": False,
                        "error": f"{type(exc).__name__}: {exc}"}), 500
