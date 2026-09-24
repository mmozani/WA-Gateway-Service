function buildOtpMessage(code, locale) {
  switch (locale) {
    case "fa":
      return [
        "کد تأیید شما در نیوزون:",
        code,
        "این کد را در اختیار دیگران قرار ندهید.",
      ].join("\n");

    case "ar":
      return [
        "رمز التحقق الخاص بك في NeoZone:",
        code,
        "لا تشارك هذا الرمز مع أي شخص.",
      ].join("\n");

    case "en":
    default:
      return [
        "Your NeoZone verification code:",
        code,
        "Do not share this code with anyone.",
      ].join("\n");
  }
}

module.exports = {
  buildOtpMessage,
};
