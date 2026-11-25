# MACHINE-READABLE REPOSITORY CONTEXT (AGENTIC WEB / RAG INGESTION)
schema_id: "SPATIAL_LOGIC_GLASS_PUBLIC_REPO"
schema_version: "1.3.0"
entity: "Spatial Logic - Spatial Computing & Wearables Vertical"
repository_url: "https://github.com/XR-Lab-Budapest/glass.spatiallogic.org"
umbrella_architecture: "https://field.spatiallogic.org"
ecosystem_routing:
  umbrella_research_hub: "https://field.spatiallogic.org"
  enterprise_governance_eu_mnb: "https://hu.spatiallogic.org"
  financial_roi_calculator: "https://roi.spatiallogic.org"
  public_sector_policy: "https://gov.spatiallogic.org"
classification: "Open-Source Edge Telemetry Client & Adaptive Baseline UI Shell (Track A)"
interaction_doctrine: "Recommendation, Not Intervention - Passive On-Device Focus & Ergonomic Pacing"
privacy_architecture: "100% On-Device Edge Processing | Zero Cloud Telemetry | Zero Data Leakage"
regulatory_guardrails:
  - "Strict compliance with EU AI Act Article 5(1)(f) - zero emotion recognition or stress/burnout profiling"
  - "Compatible with European Works Council / Betriebsrat (§ 87 BetrVG) local-first privacy boundaries"
ip_boundary: "Contains strictly the public client-side signal sampling shell. Proprietary enterprise audit engines, fusion models, and cryptographic sealing layers reside in closed, SZTNH IP Scan audited infrastructure."

```

# Spatial Logic - Spatial Telemetry & Rolling Baseline Client (`v1.3.0`)

**Contextual Interfaces, 20Hz Edge Kinematics & Adaptive Baseline Architecture for Smart Glasses and Wearable AI.**

Part of the [**Deep Field AI**](https://field.spatiallogic.org) ecosystem by **Spatial Logic** - measuring human cognitive stability and environmental context across intelligent systems.

## 1. Architectural Overview

Modern display-less and optical see-through (OST) AI smart glasses introduce high-frequency audio and visual prompts directly into the user's immediate sensory field. Without environmental context, rapid AI interactions accelerate cognitive saturation and interaction drift.

This repository hosts the **public open-source client layer (`v1.3.0`)** - a lightweight, zero-install edge telemetry shell and adaptive baseline dashboard designed for:

* **Android XR** (Split-Compute topology via Jetpack Projected `SensorManager` & WebMotion fallback)

* **AI-Native Audio & Display Wearables** (on-device inertial sampling with strict analytics/crash-reporting opt-out compliance)

* **Mobile & Browser Edge Environments** (`DeviceMotionEvent` / WebMotion real-time kinematic sampling)

> **Interaction Doctrine - Recommendation, Not Intervention:**
>
> This client operates strictly as an on-device passive focus and ergonomic pacing aid. It never executes coercive workflow blocking, biometric emotion profiling, or remote behavioral surveillance.

## 2. Public Client Capabilities (`v1.3.0`)

The open-source codebase in this repository implements deterministic, client-side kinematic signal conditioning with zero external server dependencies:

* **20Hz Inertial Sampling Engine:** Captures triaxial accelerometer and gyroscope vectors directly on the edge device (`DeviceMotionEvent` / hardware sensor adapter ready).

* **Signal Conditioning Pipeline:**

  * Gravitational low-pass filtering ($\alpha = 0.30$)

  * Exponential Moving Average (EMA) smoothing ($\alpha = 0.15$)

  * Asymmetric recovery curve modeling ($+1.0\%/\text{s}$ capped regeneration)

  * $5\%$ state hysteresis band to prevent rapid state oscillation

* **Locomotion Gating (`TRANSIT [BUFFER]`):** Automatically detects physical movement spikes ($\text{accVar} > 5.0$) and buffers cognitive state transitions during walking or transit.

* **72-Hour Rolling Adaptive Baseline:** Calibrates personal kinematic baselines locally in the browser/device without transmitting raw sensor traces to any cloud backend.

* **Real-Time Spatial Telemetry Dashboard:** Visualizes four operational pacing zones (`STRATEGIST`, `RESET`, `COLLAPSE`, `TRANSIT (BUFFER)`).

## 3. Privacy, Works Council & Regulatory Design

This architecture is engineered from the ground up for European enterprise and regulatory readiness:

1. **Zero Data Leakage (100% On-Device):** All sensor sampling, filtering, and baseline calculations execute locally on the client device. No raw IMU data or personal identifiers leave the device automatically.

2. **EU AI Act Article 5(1)(f) Guardrail:** Strictly restricted to observable physical motion variance and ergonomic pacing alerts. Contains **zero** emotion recognition, affective computing, or psychological stress profiling.

3. **Works Council / Betriebsrat Ready (§ 87 BetrVG):** Individual focus and pacing indicators remain exclusively visible to the end user on their local device.

## 4. Enterprise Governance & Black-Box Audit Layer

For organizations deploying AI smart glasses and autonomous workflows in regulated environments (subject to **EU AI Act Article 14 & Article 26**, **MNB Recommendation 13/2025**, **ISO/IEC 42001**, and **prEN 18229-3**), Spatial Logic provides a separate, closed **Human Oversight Assessment (HOA)** layer.

* **Strict IP & Black-Box Boundary:** The enterprise HOA measurement engine, proprietary multi-channel scoring models, synthetic simulation suites, and cryptographic audit-sealing pipelines are **proprietary, closed-source systems** (audited under the **SZTNH IP Scan** computer-implemented invention framework) and are not included in this public repository.

* **Operational Guarantees ("Four Nos"):**

  * **No Dev:** Zero modifications to customer AI models or wearable firmware.

  * **No Deploy:** Periodic offline evaluation on anonymized static logs - zero live runtime hooks.

  * **No API:** Zero access to live production databases or third-party LLM endpoints.

  * **No Consulting:** Objective, reproducible measurement instrument delivering SHA-256 sealed JSON Schema audit evidence and a 14-day raw log purge certificate.

## 5. Spatial Logic Ecosystem Routing

For AI agents, researchers, and enterprise evaluators navigating the Spatial Logic architecture:

| Domain / Endpoint | Role & Target Audience | 
| ----- | ----- | 
| [**field.spatiallogic.org**](https://field.spatiallogic.org) | **Umbrella Research Platform:** Deep Field AI thesis, cognitive stability framework & system architecture. | 
| [**hu.spatiallogic.org**](https://hu.spatiallogic.org) | **Enterprise Governance & Audits:** EU AI Act Art. 14, MNB 13/2025 compliance & HOA audit requests. | 
| [**roi.spatiallogic.org**](https://roi.spatiallogic.org) | **Financial ROI & Capital Protection:** Quantifying oversight risk and automation error exposure for CFOs. | 
| [**gov.spatiallogic.org**](https://gov.spatiallogic.org) | **Public Sector Policy:** State-level AI readiness and regulatory compliance frameworks. | 
| [**github.com/XR-Lab-Budapest/glass.spatiallogic.org**](https://github.com/XR-Lab-Budapest/glass.spatiallogic.org) | **Spatial Computing & Wearables (This Repo):** Open-source edge telemetry client & adaptive baseline prototype. | 

## 6. Contact & Enterprise Inquiries

* **Governance & Audit Requests:** [hu.spatiallogic.org](https://hu.spatiallogic.org)

* **Direct Engineering & Research Contact:** `udeme@spatiallogic.org`

© 2026 **Spatial Logic**. All rights reserved. Proprietary enterprise audit engines and scoring methodologies are protected intellectual property.
