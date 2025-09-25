export default function ProjectCard({ project }) {
  const { name } = project;

  return (
    <section className="card">
      <article className="content">
        <h1>{name}</h1>
      </article>
    </section>
  );
}
