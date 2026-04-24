const { execSync } = require('child_process');

const query = `query { repository(owner:"arcade-cabinet", name:"entropy-edge") { pullRequest(number:10) { reviewThreads(last: 100) { nodes { id isResolved } } } } }`;
const result = JSON.parse(execSync(`gh api graphql -F query='${query}'`).toString());
const threads = result.data.repository.pullRequest.reviewThreads.nodes;

for (const thread of threads) {
  if (!thread.isResolved) {
    console.log(`Resolving thread ${thread.id}`);
    const mutation = `mutation { resolveReviewThread(input: {threadId: "${thread.id}"}) { thread { isResolved } } }`;
    execSync(`gh api graphql -F query='${mutation}'`);
  }
}
console.log('All threads resolved.');
