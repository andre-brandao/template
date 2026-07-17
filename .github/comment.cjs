// Upsert a single PR comment identified by the marker on its first line.
module.exports = async ({ github, context, body }) => {
  const marker = body.split("\n")[0];
  const { owner, repo } = context.repo;
  const issue_number = context.payload.pull_request.number;
  const found = (
    await github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number,
      per_page: 100,
    })
  ).find((c) => c.body && c.body.includes(marker));
  if (found) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: found.id, body });
    return;
  }
  await github.rest.issues.createComment({ owner, repo, issue_number, body });
};
