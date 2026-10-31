# Regulatory notes (internal)

Moved out of the parent app, where it was the "About Regulation" screen.
This is an internal self-assessment. It has **not** been reviewed by the TGA
or a regulatory adviser.

## Intended purpose

Help parents and carers keep their child's health records and find general
information from trusted Australian sources. Not intended to diagnose,
assess symptoms, calculate doses or replace clinical judgement.

Intended users: parents and carers.

## Self-assessment against software-as-a-medical-device triggers

| Function | Present? |
| --- | --- |
| Provides general health information | Yes |
| Calculates a medicine dose or frequency for a specific child | No |
| Gives symptom triage or urgency advice | No (links to RCH fact sheets and helplines instead) |
| Diagnoses, or scores screening checklists | No (checklists are "conversation starters" with no score) |
| Replaces clinician judgement | No |
| Directly controls therapy | No |

Status: not assessed by the TGA. Get regulatory advice before offering the
app to the public, and again before switching AI features on.

## Risk register (ISO 14971-style, informal)

| Hazard | Severity | Likelihood | Residual | Main controls |
| --- | --- | --- | --- | --- |
| Parent relies on the app and misses serious illness | High | Possible | Low–moderate | No triage; 000 / healthdirect shown; RCH links |
| Medicine overdose | High | Possible | Low | No dose amounts or frequencies; "check the label and ask your pharmacist" |
| Misreading growth percentiles | Moderate | Possible | Low | Information-only wording; refer to GP or child health nurse |
| Wrong vaccine due dates | Moderate | Possible | Low | Based on NIP schedule; "confirm with your GP or the AIR" |
| Privacy breach | Moderate | Rare | Low | Data stays on device; optional passcode lock; encrypted backups; AI off |
| AI output gives medical advice | High | Possible (if AI on) | Low | AI off; consent; safety instruction; search limited to two features |

## Change control

1. Identify the change (bug fix, safety improvement, evidence update).
2. Assess impact: does it add dosing, triage, diagnosis or scoring, or change
   what data leaves the device?
3. Clinical and privacy review of anything that does.
4. Update tests (unit, end-to-end, accessibility) and this file.

## History

- 1.0: TGA self-classification and risk register (in-app screen).
- 1.1: Dose calculator, symptom triage and the WHO IMCI danger-sign mapping
  removed from the app; screen moved here.
