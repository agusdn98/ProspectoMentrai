class ProspectRanker {
  rank(prospects, limit = 30) {
    return [...prospects].sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  }
}

module.exports = new ProspectRanker();
