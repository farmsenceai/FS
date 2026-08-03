const caseStudies = require('../data/caseStudies');
const renderCaseStudyDetail = require('../views/caseStudyDetail');

function getCaseStudyBySlug(req, res) {
  const caseStudy = caseStudies.find(item => item.slug === req.params.slug);
  if (!caseStudy) {
    return res.status(404).send('Case study not found');
  }
  return res.status(200).type('html').send(renderCaseStudyDetail(caseStudy));
}

module.exports = { getCaseStudyBySlug };
