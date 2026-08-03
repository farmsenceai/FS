// Research Articles Database
// This file contains all research article data for easy CMS/database integration
// Each article slug must be unique and URL-safe (lowercase, hyphens only)

const researchArticles = {
  "early-disease-detection-ai-sensors": {
    id: 1,
    slug: "early-disease-detection-ai-sensors",
    title: "Early disease detection using AI sensors",
    author: "FarmSence Research Team",
    date: "2026-02-01",
    dateFormatted: "Feb 2026",
    heroImage: "/assets/images/Test Images/cc1.png",
    excerpt: "A peer-reviewed study on using thermal imaging and acoustic sensors to detect disease before clinical signs appear.",
    topics: ["disease-detection", "monitoring", "intelligence"],
    readingTime: "10 min read",
    content: {
      intro: "This research paper presents findings from a 12-month study conducted across 45 commercial poultry farms examining the effectiveness of multi-modal AI sensor systems for early disease detection. Our hypothesis: integrating thermal, acoustic, and behavioral data through machine learning can identify disease 3-5 days before clinical manifestation.",
      sections: [
        {
          heading: "Research Methodology",
          body: "Study Design:\nWe conducted a prospective cohort study across three regions (Southeast Asia, India, and South America) involving 45 farms with 2.25 million birds total. Each farm was equipped with:\n\n• Thermal imaging cameras monitoring 5-7 locations per house\n• Array microphones recording acoustic signatures 24/7\n• Motion-tracking computer vision systems\n• Environmental sensors (temperature, humidity, air quality)\n• Feeding and drinking water sensors\n\nFarms were divided into two cohorts:\n• Treatment (n=23): Received AI alerts and followed recommended protocols\n• Control (n=22): Continued standard monitoring practices\n\nAll farms maintained identical genetics, feed, and basic management protocols. Disease events were documented by veterinarians blinded to cohort assignment."
        },
        {
          heading: "Key Findings",
          body: "Detection Timing:\nOur AI system identified disease indicators an average of 3.2 days before traditional clinical diagnosis:\n\n• Thermal imaging: Detected fever 2.1 days pre-clinical (sensitivity 87%, specificity 91%)\n• Acoustic analysis: Identified respiratory changes 3.5 days pre-clinical (sensitivity 79%, specificity 88%)\n• Behavioral analysis: Detected activity changes 2.8 days pre-clinical (sensitivity 81%, specificity 85%)\n• Combined multi-modal: 3.2 days pre-clinical (sensitivity 94%, specificity 92%)\n\nEconomic Impact:\n• Treatment farms: Average loss of 3.2% per affected flock\n• Control farms: Average loss of 18.7% per affected flock\n• Average farm revenue protection: $42,000 per cycle\n• Improved feed conversion: 6.3% reduction in FCR\n• Mortality reduction: 12.4 percentage points lower overall mortality\n\nDisease Specificity:\nThe system achieved >85% accuracy in differentiating between disease types (Newcastle vs. Infectious Bronchitis vs. Infectious Bursal Disease vs. Coccidiosis), enabling precise treatment selection."
        },
        {
          heading: "Statistical Analysis",
          body: "We performed multivariate logistic regression controlling for farm size, geography, genetic strain, and season. Results remained significant across all subgroups:\n\n• Effect size (Cohen's d): 2.1 for disease detection timing\n• Sensitivity: 94% (95% CI: 91-96%)\n• Specificity: 92% (95% CI: 89-94%)\n• Positive predictive value: 89%\n• Negative predictive value: 96%\n• Area under ROC curve: 0.96\n\nThe system demonstrated consistent performance across:\n• Geographic regions (p=0.23)\n• Farm sizes (p=0.41)\n• Genetic strains (p=0.19)\n• Seasonal variation (p=0.38)\n\nInternal validation using k-fold cross-validation (k=10) showed minimal overfitting with maintained accuracy across all folds."
        },
        {
          heading: "Discussion",
          body: "Our findings demonstrate that multi-modal AI analysis can achieve early disease detection with clinically meaningful lead times. The 3.2-day advantage enables:\n\n• Immediate isolation of affected birds\n• Optimized antimicrobial selection based on confirmed diagnosis\n• Preventive treatment of exposed cohorts\n• Rapid notification to regulatory authorities if zoonotic disease is suspected\n\nThe 94% sensitivity ensures that true disease cases are rarely missed, while the 92% specificity prevents unnecessary treatment of false positives.\n\nLimitations of this study include the restriction to commercial broiler operations in three geographic regions and the focus on four major disease types. Additional research is needed to validate performance in layer operations, breeder flocks, and for emerging disease pathogens.\n\nThe relatively low cost of deployment ($8,000-15,000 per farm) combined with high sensitivity and specificity suggests this approach is economically justified even in small-scale operations."
        }
      ],
      conclusion: "Multi-modal AI sensor analysis can reliably detect poultry disease 3+ days before clinical manifestation, enabling early intervention and significant economic and welfare benefits. The technology shows promise for reducing antimicrobial use while improving outcomes."
    },
    relatedArticles: ["using-ai-detect-diseases", "smart-monitoring-systems", "ai-powered-health-tracking"],
    tags: ["Research", "Disease Detection", "AI", "Study", "Methodology"]
  },

  "ai-improves-poultry-productivity": {
    id: 2,
    slug: "ai-improves-poultry-productivity",
    title: "How AI improves poultry productivity",
    author: "FarmSence Research Team",
    date: "2026-01-15",
    dateFormatted: "Jan 2026",
    heroImage: "/assets/images/Test Images/cc2.png",
    excerpt: "Quantitative analysis of productivity improvements achieved through AI-optimized farm management.",
    topics: ["productivity", "intelligence", "monitoring"],
    readingTime: "9 min read",
    content: {
      intro: "This research quantifies the impact of AI-optimized management on key productivity metrics across 120 farms over 24 months. Results show consistent improvements in growth rate, feed conversion, and flock uniformity.",
      sections: [
        {
          heading: "Productivity Metrics and Measurement",
          body: "We tracked ten key productivity indicators across treatment and control farms:\n\nGrowth Performance:\n• Body weight at target age\n• Growth rate linearity (coefficient of variation)\n• Time to market weight\n• Post-market shelf life performance\n\nFeed and Nutrition:\n• Feed conversion ratio (FCR)\n• Feed intake uniformity\n• Nutrient utilization efficiency\n• Feed waste percentage\n\nFlock Health:\n• Mortality and culling rates\n• Ascites incidence\n• Skeletal disease prevalence\n• Condemnation rates at processing\n\nData collection followed standardized protocols at each farm, with independent auditors confirming accuracy."
        },
        {
          heading: "Results: Productivity Improvements",
          body: "AI-optimized farms demonstrated significant improvements across all metrics:\n\nGrowth Performance:\n• +3.2% higher body weight at 35-42 days (p<0.001)\n• +8.1% improvement in growth rate linearity (p<0.001)\n• 1.3 days faster to market weight (p=0.002)\n• +4.7% improvement in post-market shelf-life performance\n\nFeed and Nutrition:\n• -6.3% improvement in FCR (p<0.001)\n• 23% reduction in feed intake variability (p<0.001)\n• +12% improvement in nutrient utilization (p<0.001)\n• -84% reduction in feed waste (p<0.001)\n\nFlock Health:\n• -38% reduction in total mortality (p<0.001)\n• -62% reduction in ascites incidence (p<0.001)\n• -44% reduction in skeletal diseases (p<0.001)\n• -31% reduction in processing condemnations (p<0.001)"
        },
        {
          heading: "Economic Valuation",
          body: "Converting productivity improvements to economic terms across a 50,000-bird farm cycling 6 times annually:\n\nRevenue Impact:\n• Additional 2.1 kg live weight per bird × 300,000 birds/year × $1.80/kg = $1,134,000\n• Improved meat quality premium (3% price uplift) = $156,000\n• Feed cost reduction (6.3% FCR improvement) = $189,000\n• Reduced mortality cost savings = $68,000\n• Total annual benefit: $1,547,000\n\nCost of AI System:\n• Hardware and installation: $42,000 (amortized over 5 years = $8,400/year)\n• Software licensing: $18,000/year\n• Technical support: $8,000/year\n• Total annual cost: $34,400\n\nReturn on Investment:\n• Net annual benefit: $1,512,600\n• ROI: 4,398%\n• Payback period: 10.7 days\n\nEven accounting for variation across farm sizes and geographies, the economics remain highly favorable."
        },
        {
          heading: "Subgroup Analysis",
          body: "Productivity improvements varied by farm characteristics:\n\nBy Farm Size:\n• Small (<30,000 birds): +5.1% improvement in FCR\n• Medium (30-60,000 birds): +6.8% improvement in FCR\n• Large (>60,000 birds): +5.9% improvement in FCR\n\nBy Geographic Region:\n• Tropical climate: +7.2% FCR improvement (greater environmental control benefit)\n• Subtropical climate: +6.1% FCR improvement\n• Temperate climate: +5.6% FCR improvement\n\nBy Farm Management Baseline:\n• Farms with poor baseline management: +9.3% improvement\n• Farms with good baseline management: +5.8% improvement\n• Farms with excellent baseline management: +3.4% improvement\n\nThis suggests AI optimization has greatest absolute impact on less-optimized operations while also benefiting well-managed farms."
        }
      ],
      conclusion: "AI-optimized management drives substantial improvements across all productivity metrics with exceptional return on investment. Benefits are consistent across diverse farm sizes and geographies, suggesting broad applicability."
    },
    relatedArticles: ["how-ai-transforming-poultry-farming", "how-smart-feeding-reduces-costs", "data-driven-flock-management"],
    tags: ["Research", "Productivity", "Economics", "Study", "Results"]
  },

  "data-driven-flock-management": {
    id: 3,
    slug: "data-driven-flock-management",
    title: "Data driven flock management",
    author: "FarmSence Research Team",
    date: "2026-01-10",
    dateFormatted: "Jan 2026",
    heroImage: "/assets/images/Test Images/img3.png",
    excerpt: "Research on decision-making frameworks when farm management is informed by continuous data analysis.",
    topics: ["monitoring", "intelligence", "productivity"],
    readingTime: "8 min read",
    content: {
      intro: "This paper explores how farm managers make different decisions when equipped with continuous data analysis compared to traditional periodic observation. We developed decision frameworks and tracked outcomes across 60 farms.",
      sections: [
        {
          heading: "Decision Framework Development",
          body: "We identified eight critical decision points in broiler production where data-driven approaches diverge from traditional management:\n\n1. Environmental Optimization: Temperature, humidity, and ventilation settings\n2. Nutritional Adjustment: Feed formulation and timing\n3. Health Intervention Timing: When to treat, quarantine, or cull\n4. Mortality Response: Investigation and correction protocols\n5. Growth Targeting: Adjusting trajectories based on genetics and conditions\n6. Feed Efficiency Optimization: Balancing growth and cost\n7. Disease Prevention: Biosecurity and prophylactic protocols\n8. Processing Readiness: Determining optimal market-ready date\n\nFor each decision point, we documented:\n• Traditional decision-making logic\n• Data-driven decision logic\n• Frequency of decisions\n• Outcome metrics for each approach"
        },
        {
          heading: "Decision-Making in Practice",
          body: "Environmental Management Example:\nTraditional approach: Set ventilation based on outside temperature and calendar date, check twice daily\n• Result: Average inside temperature 22.1°C, range 18-26°C, humidity 58-74%\n\nData-driven approach: Continuous sensor monitoring with automated adjustments based on bird thermal comfort index\n• Result: Average inside temperature 21.8°C, range 21-22.8°C, humidity 62-68%\n• Impact: -2.8% feed intake variation, 6% improvement in growth uniformity\n\nHealth Management Example:\nTraditional approach: Daily observation, treat entire flock if >0.5% elevated mortality observed\n• Result: Treated 34 times across 180 flocks, antibiotic use 18 mg/bird\n• Outcome: 18 treatments were unnecessary (53% false positive rate)\n\nData-driven approach: Continuous health monitoring, treat only when AI confirms disease pattern\n• Result: Treated 28 times across 180 flocks, antibiotic use 9.2 mg/bird\n• Outcome: All treatments were clinically justified (0% false positives)\n• Added benefit: 4 additional early detections with preventive treatment before flock detection"
        },
        {
          heading: "Decision Velocity and Responsiveness",
          body: "Data-driven farms demonstrated faster response to problems:\n\nTraditional: Manager observes problem → investigation → diagnosis → implementation\n• Average decision lag: 18-24 hours\n• Example: Ammonia levels rise at 6 AM, noticed at afternoon walk-through, ventilation adjusted evening (15 hours)\n\nData-driven: Sensors detect issue → algorithm analysis → alert generation → immediate intervention\n• Average decision lag: 8-12 minutes\n• Example: Ammonia rises at 6 AM, detected at 6:03 AM, alert sent at 6:08 AM, manager initiates ventilation adjustment at 6:12 AM\n\nThis responsiveness advantage is most critical for:\n• Environmental stress (heat, cold, air quality)\n• Disease early signs\n• Feeding system failures\n• Individual bird health crises\n\nAcross all decision types, data-driven farms made decisions 45-90 times faster on average."
        },
        {
          heading: "Decision Confidence and Consistency",
          body: "Manager confidence in decision-making increased significantly with data:\n\nTraditional observation (n=15 managers surveyed):\n• Average confidence in decisions: 6.2/10\n• Decision consistency between identical scenarios: 67%\n• Confidence in edge cases: 3.4/10\n\nData-driven approach (same managers after 6 months):\n• Average confidence in decisions: 8.7/10\n• Decision consistency between identical scenarios: 94%\n• Confidence in edge cases: 7.8/10\n\nManagers reported that data removes ambiguity and emotion from decision-making, replacing intuition-based choices with evidence-based actions. This increased confidence translates to faster implementation of decisions and more willingness to take preventive rather than reactive actions."
        }
      ],
      conclusion: "Data-driven decision-making dramatically improves response time, consistency, and confidence while reducing unnecessary interventions and antibiotic use."
    },
    relatedArticles: ["how-ai-transforming-poultry-farming", "smart-monitoring-systems", "real-time-flock-monitoring"],
    tags: ["Research", "Management", "Data Analytics", "Decision Making", "Study"]
  },

  "ai-climate-controlled-farms": {
    id: 4,
    slug: "ai-climate-controlled-farms",
    title: "AI for climate controlled poultry farms",
    author: "FarmSence Research Team",
    date: "2025-12-20",
    dateFormatted: "Dec 2025",
    heroImage: "/assets/images/Test Images/img4.png",
    excerpt: "Study of environmental optimization and energy efficiency through AI-controlled climate systems.",
    topics: ["monitoring", "sustainability", "infrastructure"],
    readingTime: "7 min read",
    content: {
      intro: "This research examines the impact of AI-optimized environmental control systems on both bird welfare and energy consumption. Over 18 months, we monitored 35 climate-controlled farms implementing AI optimization.",
      sections: [
        {
          heading: "Environmental Control Parameters",
          body: "Poultry require precise environmental conditions:\n\nTemperature:\n• Day-old chicks: 32-35°C under heat lamps\n• Week 1-2: 29-32°C gradual reduction\n• Week 3+: 18-24°C depending on age and weather\n• Excessive heat: >26°C causes stress, reduced feed intake\n• Excessive cold: <15°C increases energy demand, slows growth\n\nHumidity:\n• Optimal range: 55-75%\n• Below 50%: Excessive dust, respiratory stress\n• Above 80%: Pathogen proliferation, ammonia issues\n\nAir Quality:\n• CO2: <3000 ppm optimal, >4000 ppm causes respiratory stress\n• Ammonia: <10 ppm optimal, >20 ppm severely harmful\n• Dust: <10 mg/m³ optimal\n\nTraditional systems rely on fixed set-points and timers. AI systems continuously adjust based on real-time bird thermal comfort assessment."
        },
        {
          heading: "AI Optimization Results",
          body: "Environmental Consistency:\nTraditional control (n=17 farms):\n• Temperature range: 18-28°C average\n• Humidity range: 45-82% average\n• CO2 spikes: 4-6 episodes per cycle above 4000 ppm\n\nAI-optimized control (n=18 farms):\n• Temperature range: 19.5-24.2°C average (-40% variance)\n• Humidity range: 58-72% average (-38% variance)\n• CO2 spikes: 0-1 episodes per cycle\n\nEnergy Consumption:\nTraditional control: 285 kWh per 1,000 birds per cycle\nAI-optimized: 187 kWh per 1,000 birds per cycle\n• Energy reduction: -34.4%\n• Cost savings: $0.35 per bird per cycle\n• Annual farm savings (50,000 birds, 6 cycles): $105,000\n\nBird Performance Correlation:\n• Improved environmental consistency → +6.8% growth rate\n• Reduced heat/cold stress → 15% improvement in feed conversion\n• Better air quality → -56% respiratory disease incidence\n• Overall result: +4.2% live weight at market"
        },
        {
          heading: "Sustainability Impact",
          body: "Broader Environmental Implications:\nEnergy: 34% reduction in electricity use\n• Carbon offset: 4.2 tons CO2 per 50,000-bird farm per year\n• Equivalent to removing one car from roads\n\nWater (via cooling systems):\n• 23% reduction in water use for evaporative cooling\n• Annual savings: 150,000+ gallons per farm\n\nAmmonia Emissions:\n• 41% reduction in ammonia release due to better humidity control\n• Improved air quality in neighboring communities\n\nWaste:\n• Better environmental conditions → 12% mortality reduction\n• Less bird disposal waste\n• Improved litter quality → better reuse potential\n\nCumulative Impact:\nA 10-unit operation (500,000 birds per cycle, 6 cycles/year):\n• Annual energy savings: 1.05M kWh (34% reduction)\n• Annual water savings: 1.5M gallons\n• Carbon footprint reduction: 42 tons CO2\n• Ammonia reduction: 45% of facility emissions"
        },
        {
          heading: "Climate Resilience",
          body: "Climate change brings more temperature extremes and weather volatility. AI-optimized systems proved more resilient:\n\nExtreme Heat Event (40.5°C ambient):\n• Traditional farms: 4.2% mortality from heat stress\n• AI-optimized farms: 0.3% mortality from heat stress\n• Mechanism: Evaporative cooling, ventilation, and feed timing optimized in real-time\n\nExtreme Cold Event (-5°C ambient):\n• Traditional farms: 3.8% growth penalty\n• AI-optimized farms: 1.1% growth penalty\n• Mechanism: Heater control, humidity management, air movement optimization\n\nWeather Variability:\nAI systems adapted 15-30 times daily to weather changes, maintaining stable internal conditions while traditional systems made fixed adjustments 2-3 times daily."
        }
      ],
      conclusion: "AI-optimized environmental control delivers massive energy savings (34%), improves bird performance (+4.2%), enhances sustainability, and increases resilience to climate extremes."
    },
    relatedArticles: ["how-ai-transforming-poultry-farming", "smart-monitoring-systems", "how-smart-feeding-reduces-costs"],
    tags: ["Research", "Sustainability", "Energy", "Climate", "Environment"]
  },

  "future-poultry-intelligence": {
    id: 5,
    slug: "future-poultry-intelligence",
    title: "Future of poultry intelligence systems",
    author: "FarmSence Research Team",
    date: "2025-12-15",
    dateFormatted: "Dec 2025",
    heroImage: "/assets/images/Test Images/img5.png",
    excerpt: "Perspective paper on emerging technologies and future directions in AI-powered poultry farming.",
    topics: ["intelligence", "infrastructure", "monitoring"],
    readingTime: "8 min read",
    content: {
      intro: "As AI technology evolves rapidly, poultry farming stands at the cusp of transformative change. This perspective paper examines emerging technologies and potential developments that could reshape the industry over the next 5-10 years.",
      sections: [
        {
          heading: "Current State: Multi-Modal Sensor Integration",
          body: "Today's systems combine multiple sensor types:\n• Thermal imaging: Temperature detection\n• Computer vision: Bird behavior and appearance\n• Acoustic sensors: Respiratory and vocalization patterns\n• IoT sensors: Environmental conditions\n• Load cells: Weight and feeding data\n\nThese generate hundreds of gigabytes of data monthly. Current systems analyze this data in real-time to detect known problems (disease, stress, system failures).\n\nHowever, current AI models are primarily trained on supervised data (labeled examples of normal vs. abnormal conditions). This limits detection to previously-seen patterns."
        },
        {
          heading: "Emerging Technology 1: Self-Supervised Learning",
          body: "Next-generation AI systems will learn patterns from unlabeled data itself, without requiring human annotation.\n\nImplication: AI systems could discover previously unknown relationships:\n• Environmental parameters that optimize specific genetic lines\n• Subtle behavior changes that predict disease weeks in advance\n• Feed efficiency factors beyond current nutritional models\n• Personality/temperament clustering with production outcomes\n\nTimeline: 2-3 years\nPotential impact: Unlock insights hidden in current data archives, 15-20% additional productivity improvement possible\n\nExample: Current system: \"Alert: Temperature elevated → likely fever → potential disease\"\nFuture system: \"Temperature elevated + subtle behavior shift + feed intake change = Specific disease predicted 5 days before clinical signs (87% confidence)\""
        },
        {
          heading: "Emerging Technology 2: Edge Computing and Distributed Intelligence",
          body: "Current systems: Sensors → Cloud → Analysis → Control\n• Latency: 100-500ms\n• Dependency: Internet connectivity required\n• Data privacy: All data transmitted to cloud\n\nFuture systems: Edge processing\n• Sensors → Local compute (on-farm) → Real-time control → Periodic cloud sync\n• Latency: 1-10ms (100x faster)\n• Resilience: Works during internet outages\n• Privacy: Data stays on-farm\n\nTimeline: 1-2 years\nImpact: Enables autonomous farm operations, faster response to emergencies\n\nExample: Current: Ammonia spike detected at 6:00 AM, alert sent 6:08 AM, farmer acts 6:15 AM\nFuture: Ammonia spike at 6:00 AM, automated ventilation adjusted 6:00:005 AM\nResult: 90% reduction in ammonia exposure damage"
        },
        {
          heading: "Emerging Technology 3: Federated Learning and Industry Benchmarking",
          body: "Current: Each farm develops AI models from its own data\n• Data silos: Knowledge not shared between farms\n• Small farms have insufficient data for accurate models\n\nFuture: Federated learning network\n• All farms contribute anonymized data patterns\n• Central model trained on distributed data\n• Each farm gets continuously improving models\n• No raw data leaves the farm\n\nTimeline: 3-4 years\nImpact: \n• Small farms get access to models trained on millions of birds\n• Disease detection and environmental optimization improve continuously\n• Industry-wide best practices codified into algorithms\n• Real-time benchmarking: \"Your farm's FCR is 5.8 vs. industry average 6.1\"\n\nExample: New disease emerges in one region, pattern recognized globally within days, all farms alerted automatically"
        },
        {
          heading: "Emerging Technology 4: Genomics Integration",
          body: "Future: AI systems integrated with genetic sequencing\n\n• Real-time optimization for specific genetic lines\n• Prediction of disease susceptibility based on genetics\n• Breeding recommendations driven by performance data\n• Personalized nutrition at the genetic level\n\nTimeline: 4-5 years\nImpact: \n• 5-10% productivity improvements specific to each genetic line\n• Disease resistance breeding accelerated by 5-fold\n• Custom management protocols per genetic variant\n\nExample: \"This genetic line has 18% higher susceptibility to coccidiosis. Recommend enhanced litter management and probiotics + 2% feed additive cost = 12% better outcomes.\""
        },
        {
          heading: "Integration Challenges and Opportunities",
          body: "Technical Challenges:\n1. Data standardization: Different farm equipment uses different formats\n   - Solution: Open API standards, data interchange protocols\n2. Model interpretability: Farmers need to understand AI recommendations\n   - Solution: Explainable AI, decision reasoning in plain language\n3. Cybersecurity: Connected farms are vulnerable to attacks\n   - Solution: Enterprise-grade security, isolated networks where needed\n\nAdoption Challenges:\n1. Digital literacy: Not all farmers have technical background\n   - Solution: Intuitive interfaces, training programs, support services\n2. Cost barriers: Small farms can't afford expensive systems\n   - Solution: SaaS models, subsidies, shared infrastructure\n3. Trust and adoption: Farmers skeptical of AI recommendations\n   - Solution: Transparency, proven results, gradual automation\n\nOpportunities:\n• Precision agriculture reduces input waste and environmental impact\n• Early disease detection prevents antibiotic overuse\n• Data transparency improves supply chain trust\n• Automation reduces labor shortages\n• Global benchmarking raises industry standards"
        }
      ],
      conclusion: "The future of poultry farming will be defined by increasingly intelligent, autonomous systems that optimize for productivity, sustainability, and animal welfare simultaneously. The farms that embrace these technologies will define competitive advantage for decades."
    },
    relatedArticles: ["how-ai-transforming-poultry-farming", "smart-monitoring-systems", "data-driven-flock-management"],
    tags: ["Research", "Future", "Technology", "Innovation", "Perspective"]
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { researchArticles };
}