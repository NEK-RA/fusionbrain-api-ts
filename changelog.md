## 0.0.3

- Changed `axios` version to 1.7.4 due to fix of [CVE-2024-39338](https://github.com/advisories/GHSA-8hc4-vh64-cxmj)

## 0.0.2

- Enum `FusionBrainErrorCode` includes new value `MODEL_NOT_READY`
- `FusionBrainError` now has optional `body` field, which being set when `MODEL_NOT_READY` or `UNEXPECTED` error appears
- `AvailabilityInfo` class removed due to being redundant
- `checkModel` replaced with `isReady`, which returns true if model available, otherwise false. With optional second argument it throws `FusionBrainError` object which will include HTTP response body with reason of unavailability
- `Prompt` class is no longer used, generation method now accepts 3 parameters: model, prompt, additional options
- `GenerationTask` renamed to `Task`
- Old union type (of generation result) `GenerationTask | AvailabilityInfo` was replaced with `Generation`, which includes boolean `accepted` field and depending on it's value it includes either `task: Task` field, or `reason: string` field 


## 0.0.1

First release