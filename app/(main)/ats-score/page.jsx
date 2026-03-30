'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, AlertCircle } from 'lucide-react';

export default function ATSScorePage() {
  const [file, setFile] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      
      const mockScore = Math.floor(Math.random() * 40) + 60; 
      
      setAtsScore(mockScore);
      setFeedback(generateFeedback(mockScore));
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = (score) => {
    if (score >= 85) {
      return {
        status: 'Excellent',
        color: 'text-green-600',
        suggestions: [
          'Your resume is well-optimized for ATS systems',
          'Good use of keywords and formatting',
          'Consider adding more industry-specific terms to boost further',
        ],
      };
    } else if (score >= 70) {
      return {
        status: 'Good',
        color: 'text-blue-600',
        suggestions: [
          'Add more relevant keywords to your resume',
          'Improve formatting to ensure ATS compatibility',
          'Include specific skills and certifications',
        ],
      };
    } else {
      return {
        status: 'Needs Improvement',
        color: 'text-red-600',
        suggestions: [
          'Simplify the resume format (avoid tables and graphics)',
          'Add more relevant industry keywords',
          'Use clear section headings: Experience, Education, Skills',
        ],
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">ATS Score Check</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Check how well your resume is optimized for Applicant Tracking Systems (ATS). Get actionable feedback to improve your chances of getting past automated screening.
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Resume</CardTitle>
              <CardDescription>PDF, DOCX, or TXT format (Max 5MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-lg font-medium mb-1">Drop your resume here</span>
                    <span className="text-sm text-muted-foreground">or click to browse</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                </div>

                {file && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Selected file: {file.name}</p>
                  </div>
                )}

                {loading && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Analyzing your resume...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ATS Score Result */}
        {atsScore !== null && !loading && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your ATS Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Circle */}
                <div className="flex justify-center">
                  <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {atsScore}
                      </div>
                      <div className={`text-lg font-semibold ${feedback?.color} mt-2`}>
                        {feedback?.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Score Progress</span>
                    <span className="font-medium">{atsScore}/100</span>
                  </div>
                  <Progress value={atsScore} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            {feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feedback.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setAtsScore(null);
                  setFeedback(null);
                  setFile(null);
                }}
              >
                Check Another Resume
              </Button>
              <Button>
                Improve My Resume
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
