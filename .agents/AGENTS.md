
# STRICT PRODUCTION RULE: ABSOLUTELY NO MOCK OR HARDCODED DATA

- The application is in PRODUCTION.
- NEVER use mock data, dummy data, or hardcoded fallbacks (e.g. 'DEFAULT_DESCRIPTION', 'lorem ipsum', mock business lists, static arrays of fake data).
- If data from the database is missing or empty, render it as empty or hide the corresponding UI element. DO NOT insert fake data to 'make it look good'.
- Delete any existing mock files when encountered.

