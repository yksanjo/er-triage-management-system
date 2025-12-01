from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TriageService:
    """
    AI-powered triage assessment service
    Uses multi-modal analysis (text + vital signs) to determine triage level
    """
    
    def __init__(self):
        # In production, load AI models here
        # self.model = load_triage_model()
        pass
    
    async def assess(
        self,
        chief_complaint: str,
        additional_notes: Optional[str] = None,
        vital_signs: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Perform AI-powered triage assessment
        
        Args:
            chief_complaint: Patient's main complaint
            additional_notes: Additional clinical notes
            vital_signs: Extracted vital signs
            
        Returns:
            Triage assessment result with level, score, and recommendations
        """
        try:
            # Combine all inputs for multi-modal analysis
            analysis_input = {
                "chief_complaint": chief_complaint,
                "additional_notes": additional_notes or "",
                "vital_signs": vital_signs or {}
            }
            
            # In production, this would call an AI model (e.g., GPT-4, Claude, or custom model)
            # For now, use rule-based assessment with AI-like reasoning
            
            result = self._assess_with_rules(analysis_input)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in triage assessment: {str(e)}")
            raise
    
    def _assess_with_rules(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule-based triage assessment (fallback/placeholder)
        In production, this would be replaced with AI model inference
        """
        chief_complaint = input_data["chief_complaint"].lower()
        vital_signs = input_data.get("vital_signs", {})
        
        # Critical keywords
        critical_keywords = [
            "chest pain", "heart attack", "cardiac arrest", "unconscious",
            "not breathing", "severe bleeding", "stroke", "seizure",
            "severe trauma", "anaphylaxis"
        ]
        
        urgent_keywords = [
            "difficulty breathing", "severe pain", "high fever",
            "abdominal pain", "head injury", "fracture"
        ]
        
        # Check vital signs first
        level = "3"  # Default: Urgent
        priority_score = 50
        recommendations = []
        
        if vital_signs:
            hr = vital_signs.get("heartRate")
            rr = vital_signs.get("respiratoryRate")
            spo2 = vital_signs.get("oxygenSaturation")
            bp_systolic = vital_signs.get("bloodPressure", {}).get("systolic") if isinstance(vital_signs.get("bloodPressure"), dict) else None
            
            # Level 1: Immediate (life-threatening)
            if (
                (hr and (hr < 40 or hr > 150)) or
                (rr and (rr < 8 or rr > 30)) or
                (spo2 and spo2 < 90) or
                (bp_systolic and bp_systolic < 80) or
                vital_signs.get("consciousness") == "unresponsive"
            ):
                level = "1"
                priority_score = 100
                recommendations = [
                    "Immediate physician assessment required",
                    "Prepare resuscitation equipment",
                    "Continuous monitoring essential"
                ]
            
            # Level 2: Very urgent
            elif (
                (hr and (hr < 50 or hr > 120)) or
                (rr and (rr < 12 or rr > 24)) or
                (spo2 and spo2 < 94) or
                (bp_systolic and bp_systolic < 100) or
                vital_signs.get("consciousness") == "confused" or
                vital_signs.get("painLevel", 0) >= 8
            ):
                level = "2"
                priority_score = 80
                recommendations = [
                    "Urgent assessment within 10 minutes",
                    "Monitor vital signs closely"
                ]
            
            # Level 3: Urgent
            elif (
                (hr and (hr < 60 or hr > 100)) or
                (rr and (rr < 14 or rr > 20)) or
                (spo2 and spo2 < 96) or
                vital_signs.get("painLevel", 0) >= 5
            ):
                level = "3"
                priority_score = 60
                recommendations = [
                    "Assessment within 30 minutes",
                    "Standard monitoring"
                ]
            
            # Level 4: Semi-urgent
            elif vital_signs.get("painLevel", 0) >= 3 or vital_signs.get("temperature", 0) > 38.5:
                level = "4"
                priority_score = 40
                recommendations = ["Assessment within 1 hour"]
            
            # Level 5: Non-urgent
            else:
                level = "5"
                priority_score = 20
                recommendations = ["Routine assessment"]
        
        # Check chief complaint keywords if no critical vital signs
        if level == "3" and not vital_signs:
            if any(keyword in chief_complaint for keyword in critical_keywords):
                level = "2"
                priority_score = 75
                recommendations = [
                    "Urgent assessment - collect vital signs immediately",
                    "Monitor for deterioration"
                ]
            elif any(keyword in chief_complaint for keyword in urgent_keywords):
                level = "3"
                priority_score = 55
                recommendations = [
                    "Standard assessment - collect vital signs",
                    "Monitor symptoms"
                ]
            else:
                level = "4"
                priority_score = 35
                recommendations = ["Routine assessment"]
        
        # Calculate estimated wait time
        wait_times = {
            "1": 0,
            "2": 10,
            "3": 30,
            "4": 60,
            "5": 120
        }
        
        notes = f"Triage assessment based on {'vital signs and ' if vital_signs else ''}chief complaint: {input_data['chief_complaint']}"
        if input_data.get("additional_notes"):
            notes += f"\nAdditional notes: {input_data['additional_notes']}"
        
        return {
            "level": level,
            "priorityScore": priority_score,
            "notes": notes,
            "recommendations": recommendations,
            "estimatedWaitTime": wait_times.get(level, 60)
        }

