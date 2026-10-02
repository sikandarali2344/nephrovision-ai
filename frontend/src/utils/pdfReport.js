import jsPDF from 'jspdf'

/**
 * Generates and downloads a CKD risk PDF report from a prediction record.
 * `record` must have: ckd_probability, ckd_stage, kidney_failure_risk,
 * dialysis_required, model_version, and optionally shap_top_features /
 * shap_explanation (either key name is accepted).
 */
export function downloadPatientReport(record, patientName = null) {
  const shapFeatures = record.shap_top_features || record.shap_explanation || []
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setTextColor(14, 165, 233)
  doc.text('NephroVision AI — CKD Risk Report', 14, 20)
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  if (patientName) doc.text(`Patient: ${patientName}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, patientName ? 34 : 28)
  doc.line(14, patientName ? 38 : 32, 196, patientName ? 38 : 32)

  let y = patientName ? 48 : 42
  doc.setFontSize(13)
  doc.text('Result Summary', 14, y); y += 8
  doc.setFontSize(11)
  doc.text(`CKD Probability: ${(record.ckd_probability * 100).toFixed(1)}%`, 14, y); y += 7
  doc.text(`Predicted Stage: ${record.ckd_stage}`, 14, y); y += 7
  doc.text(`Kidney Failure Risk: ${record.kidney_failure_risk}`, 14, y); y += 7
  doc.text(`Dialysis Required (flag): ${record.dialysis_required ? 'Yes' : 'No'}`, 14, y); y += 7
  doc.text(`Model: ${record.model_version || 'n/a'}`, 14, y); y += 12

  if (shapFeatures.length) {
    doc.setFontSize(13)
    doc.text('Top Contributing Factors (SHAP)', 14, y); y += 8
    doc.setFontSize(10)
    shapFeatures.forEach((f) => {
      doc.text(`${f.feature.replace(/^(num__|cat__)/, '')}: impact ${f.impact}`, 14, y)
      y += 6
    })
  }

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    'AI-generated risk assessment is for decision support and does not replace professional medical evaluation.',
    14, 285
  )

  doc.save(`nephrovision-ckd-report${patientName ? '-' + patientName.replace(/\s+/g, '_') : ''}.pdf`)
}
