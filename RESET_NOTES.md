# LP Performance MVP Reset

## What was removed on purpose
- Community, friends, challenges, bootcamps, calendar, recipes, meal scanner, and all AI/demo scan logic.
- Group channels and social features.
- Overbuilt workout extras like warmup/cooldown flows, demo videos, and session-only exercise swapping.
- Community and friendship database concepts.

## What remains
- Coach/client roles.
- Client assignments.
- Training programs and program days.
- Workout logging.
- Nutrition plans and assignments.
- Weekly check-ins with coach replies.
- Direct coach/client messaging.

## Deliberate simplifications
- User switching is still a lightweight dev-mode selector instead of a production login flow.
- UI is rebuilt as a clean minimal interface rather than preserving the original visual system.
- This reset focuses on the working coaching loop first, not polish.

## Recommended next build steps
1. Replace the dev-mode user switcher with real authentication.
2. Add edit/delete flows for program exercises and nutrition plans.
3. Add file attachments for check-ins and messages only if genuinely needed.
4. Add validation and permissions hardening around coach/client access.
5. Add migrations for the new reduced schema and test against a real database.
