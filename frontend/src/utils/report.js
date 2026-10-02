import jsPDF from 'jspdf'

export function downloadAssessmentReport(record, patientName = 'Patient') {
  const doc = new jsPDF()
  const probability = Number(record.ckd_probability || 0)
  doc.setFontSize(18)
  doc.setTextColor(14, 116, 144)
  doc.text('NephroVision AI | CKD Risk Report', 14, 20)
  doc.setFontSize(11)
  doc.setTextColor(35, 45, 55)
  doc.text(`Patient: ${patientName}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37)
  if (record.created_at) doc.text(`Assessment date: ${new Date(record.created_at).toLocaleString()}`, 14, 44)
  doc.line(14, 49, 196, 49)

  let y = 60
  doc.setFontSize(12)
  doc.text(`CKD probability: ${(probability * 100).toFixed(1)}%`, 14, y); y += 8
  doc.text(`Predicted stage: ${record.ckd_stage || 'Not available'}`, 14, y); y += 8
  doc.text(`Kidney failure risk: ${record.kidney_failure_risk || 'Not available'}`, 14, y); y += 8
  doc.text(`Dialysis flag: ${record.dialysis_required ? 'Yes' : 'No'}`, 14, y); y += 8
  doc.text(`Model version: ${record.model_version || 'Not available'}`, 14, y); y += 14

  const factors = record.shap_explanation || record.shap_top_features || []
  if (factors.length) {
    doc.setFontSize(12)
    doc.text('Contributing factors', 14, y); y += 8
    doc.setFontSize(10)
    factors.slice(0, 10).forEach((factor) => {
      if (y > 265) { doc.addPage(); y = 20 }
      doc.text(`${factor.feature}: impact ${factor.impact}`, 14, y)
      y += 6
    })
  }

  doc.setFontSize(9)
  doc.setTextColor(100, 110, 120)
  const disclaimer = 'AI-generated risk assessment is for decision support and does not replace professional medical evaluation.'
  doc.text(doc.splitTextToSize(disclaimer, 180), 14, 282)
  doc.save(`nephrovision-assessment-${record.id || 'report'}.pdf`)
}
