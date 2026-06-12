interface Props {
  name: string;
  client?: string;
  status: string;
}

export default function ProjectCard({
  name,
  client,
  status,
}: Props) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-semibold text-lg">
        {name}
      </h2>

      <p>{client}</p>

      <p className="text-sm text-gray-500">
        {status}
      </p>
    </div>
  );
}