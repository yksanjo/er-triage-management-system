import axios from 'axios';
import { logger } from '../utils/logger';

export interface VitalSigns {
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodPressure?: {
    systolic?: number;
    diastolic?: number;
  };
  temperature?: number;
  consciousness?: string;
  painLevel?: number;
  skinColor?: string;
  capillaryRefill?: number;
}

export interface TriageAssessmentInput {
  patientId: string;
  chiefComplaint: string;
  additionalNotes?: string;
  vitalSigns?: VitalSigns | null;
  assessedBy: string;
}

export interface TriageResult {
  level: '1' | '2' | '3' | '4' | '5'; // Japanese Emergency Triage Scale
  priorityScore: number;
  notes: string;
  recommendations: string[];
  estimatedWaitTime?: number;
}

export class TriageService {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Process video to extract vital signs using AI service
   */
  async processVideoForVitalSigns(
    videoPath?: string,
    videoBuffer?: Buffer
  ): Promise<VitalSigns | null> {
    try {
      if (!videoPath && !videoBuffer) {
        return null;
      }

      // Call AI service for video analysis
      const formData = new FormData();
      if (videoBuffer) {
        const blob = new Blob([videoBuffer]);
        formData.append('video', blob, 'video.mp4');
      }

      const response = await axios.post(
        `${this.aiServiceUrl}/api/vital-signs/extract`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      return response.data.vitalSigns;
    } catch (error) {
      logger.error('Error processing video for vital signs:', error);
      // Return null if AI service fails - manual entry can be used
      return null;
    }
  }

  /**
   * Perform triage assessment based on Japanese Emergency Medicine guidelines
   */
  async performTriageAssessment(
    input: TriageAssessmentInput
  ): Promise<TriageResult> {
    try {
      // Call AI service for triage decision
      const response = await axios.post(
        `${this.aiServiceUrl}/api/triage/assess`,
        {
          chiefComplaint: input.chiefComplaint,
          additionalNotes: input.additionalNotes,
          vitalSigns: input.vitalSigns,
        },
        {
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error in AI triage assessment:', error);
      // Fallback to rule-based assessment
      return this.fallbackTriageAssessment(input);
    }
  }

  /**
   * Fallback rule-based triage assessment
   */
  private fallbackTriageAssessment(
    input: TriageAssessmentInput
  ): TriageResult {
    const { vitalSigns, chiefComplaint } = input;
    let priorityScore = 50; // Default medium priority
    let level: '1' | '2' | '3' | '4' | '5' = '3';
    const recommendations: string[] = [];

    // Critical vital signs check
    if (vitalSigns) {
      // Level 1: Immediate (life-threatening)
      if (
        vitalSigns.heartRate && vitalSigns.heartRate < 40 ||
        vitalSigns.heartRate && vitalSigns.heartRate > 150 ||
        vitalSigns.respiratoryRate && vitalSigns.respiratoryRate < 8 ||
        vitalSigns.respiratoryRate && vitalSigns.respiratoryRate > 30 ||
        vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 90 ||
        vitalSigns.bloodPressure?.systolic && vitalSigns.bloodPressure.systolic < 80 ||
        vitalSigns.consciousness === 'unresponsive'
      ) {
        level = '1';
        priorityScore = 100;
        recommendations.push('Immediate physician assessment required');
        recommendations.push('Prepare resuscitation equipment');
      }
      // Level 2: Very urgent (within 10 minutes)
      else if (
        vitalSigns.heartRate && (vitalSigns.heartRate < 50 || vitalSigns.heartRate > 120) ||
        vitalSigns.respiratoryRate && (vitalSigns.respiratoryRate < 12 || vitalSigns.respiratoryRate > 24) ||
        vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 94 ||
        vitalSigns.bloodPressure?.systolic && vitalSigns.bloodPressure.systolic < 100 ||
        vitalSigns.consciousness === 'confused' ||
        vitalSigns.painLevel && vitalSigns.painLevel >= 8
      ) {
        level = '2';
        priorityScore = 80;
        recommendations.push('Urgent assessment within 10 minutes');
      }
      // Level 3: Urgent (within 30 minutes)
      else if (
        vitalSigns.heartRate && (vitalSigns.heartRate < 60 || vitalSigns.heartRate > 100) ||
        vitalSigns.respiratoryRate && (vitalSigns.respiratoryRate < 14 || vitalSigns.respiratoryRate > 20) ||
        vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 96 ||
        vitalSigns.painLevel && vitalSigns.painLevel >= 5
      ) {
        level = '3';
        priorityScore = 60;
        recommendations.push('Assessment within 30 minutes');
      }
      // Level 4: Semi-urgent (within 1 hour)
      else if (
        vitalSigns.painLevel && vitalSigns.painLevel >= 3 ||
        vitalSigns.temperature && vitalSigns.temperature > 38.5
      ) {
        level = '4';
        priorityScore = 40;
        recommendations.push('Assessment within 1 hour');
      }
      // Level 5: Non-urgent (within 2 hours)
      else {
        level = '5';
        priorityScore = 20;
        recommendations.push('Routine assessment');
      }
    } else {
      // No vital signs - use chief complaint keywords
      const criticalKeywords = [
        'chest pain', 'difficulty breathing', 'unconscious', 'severe pain',
        'bleeding', 'trauma', 'stroke', 'heart attack', 'seizure'
      ];
      const urgentKeywords = [
        'fever', 'abdominal pain', 'headache', 'nausea', 'vomiting'
      ];

      const complaintLower = chiefComplaint.toLowerCase();
      
      if (criticalKeywords.some(keyword => complaintLower.includes(keyword))) {
        level = '2';
        priorityScore = 75;
        recommendations.push('Urgent assessment - collect vital signs immediately');
      } else if (urgentKeywords.some(keyword => complaintLower.includes(keyword))) {
        level = '3';
        priorityScore = 55;
        recommendations.push('Standard assessment - collect vital signs');
      } else {
        level = '4';
        priorityScore = 35;
        recommendations.push('Routine assessment');
      }
    }

    const notes = `Triage assessment based on ${vitalSigns ? 'vital signs and ' : ''}chief complaint: ${chiefComplaint}`;

    return {
      level,
      priorityScore,
      notes,
      recommendations,
      estimatedWaitTime: this.calculateEstimatedWaitTime(level),
    };
  }

  private calculateEstimatedWaitTime(level: string): number {
    const waitTimes: Record<string, number> = {
      '1': 0,      // Immediate
      '2': 10,     // 10 minutes
      '3': 30,     // 30 minutes
      '4': 60,     // 1 hour
      '5': 120,    // 2 hours
    };
    return waitTimes[level] || 60;
  }
}

