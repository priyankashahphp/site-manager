import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { createBuilding, createFloor, createUnit, getSite } from "@/api/projects";

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [newBuildingName, setNewBuildingName] = useState("");

  const { data: site, isLoading } = useQuery({
    queryKey: ["sites", id],
    queryFn: () => getSite(id!),
    enabled: !!id,
  });

  const addBuilding = useMutation({
    mutationFn: () => createBuilding(id!, newBuildingName),
    onSuccess: () => {
      setNewBuildingName("");
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
    },
  });

  if (isLoading) return <p className="text-sm text-concrete-400">Loading…</p>;
  if (!site) return <p className="text-sm text-concrete-400">Site not found.</p>;

  return (
    <div>
      <div className="mb-1 flex items-start justify-between">
        <h1 className="text-xl font-semibold text-concrete-900">{site.name}</h1>
        <div className="flex gap-2">
          <Link
            to={`/sites/${site.id}/diary`}
            className="rounded border border-concrete-200 px-3 py-2 text-sm font-medium text-concrete-700 hover:bg-concrete-50"
          >
            Diary
          </Link>
          <Link
            to={`/sites/${site.id}/quality-safety`}
            className="rounded border border-concrete-200 px-3 py-2 text-sm font-medium text-concrete-700 hover:bg-concrete-50"
          >
            Quality & Safety
          </Link>
          <Link
            to={`/sites/${site.id}/stock`}
            className="rounded border border-concrete-200 px-3 py-2 text-sm font-medium text-concrete-700 hover:bg-concrete-50"
          >
            Stock
          </Link>
        </div>
      </div>
      {site.address && <p className="mb-6 text-sm text-concrete-400">{site.address}</p>}

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (newBuildingName.trim()) addBuilding.mutate();
        }}
        className="mb-6 flex gap-2"
      >
        <input
          value={newBuildingName}
          onChange={(e) => setNewBuildingName(e.target.value)}
          placeholder="New building name (e.g. Tower A)"
          className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
        />
        <button
          type="submit"
          disabled={addBuilding.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          Add building
        </button>
      </form>

      <div className="space-y-4">
        {site.buildings?.map((building) => (
          <BuildingCard key={building.id} building={building} siteId={site.id} />
        ))}
      </div>

      {site.buildings?.length === 0 && (
        <div className="rounded-md border border-dashed border-concrete-300 py-12 text-center">
          <p className="text-sm text-concrete-400">No buildings added yet.</p>
        </div>
      )}
    </div>
  );
}

function BuildingCard({ building, siteId }: { building: any; siteId: string }) {
  const queryClient = useQueryClient();
  const [newFloorName, setNewFloorName] = useState("");

  const addFloor = useMutation({
    mutationFn: () => createFloor(building.id, newFloorName),
    onSuccess: () => {
      setNewFloorName("");
      queryClient.invalidateQueries({ queryKey: ["sites", siteId] });
    },
  });

  return (
    <div className="rounded-md border border-concrete-200 bg-white p-5">
      <p className="mb-3 font-medium text-concrete-900">{building.name}</p>

      <div className="space-y-3 border-l-2 border-concrete-100 pl-4">
        {building.floors?.map((floor: any) => (
          <FloorRow key={floor.id} floor={floor} siteId={siteId} />
        ))}

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (newFloorName.trim()) addFloor.mutate();
          }}
          className="flex gap-2"
        >
          <input
            value={newFloorName}
            onChange={(e) => setNewFloorName(e.target.value)}
            placeholder="New floor (e.g. Ground Floor)"
            className="w-56 rounded border border-concrete-200 px-2 py-1.5 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
          <button
            type="submit"
            disabled={addFloor.isPending}
            className="rounded border border-concrete-200 px-2.5 py-1.5 text-sm text-concrete-700 hover:bg-concrete-50 disabled:opacity-60"
          >
            + Floor
          </button>
        </form>
      </div>
    </div>
  );
}

function FloorRow({ floor, siteId }: { floor: any; siteId: string }) {
  const queryClient = useQueryClient();
  const [newUnitName, setNewUnitName] = useState("");

  const addUnit = useMutation({
    mutationFn: () => createUnit(floor.id, { name: newUnitName }),
    onSuccess: () => {
      setNewUnitName("");
      queryClient.invalidateQueries({ queryKey: ["sites", siteId] });
    },
  });

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-concrete-700">{floor.name}</p>
      <div className="flex flex-wrap items-center gap-2">
        {floor.units?.map((unit: any) => (
          <span
            key={unit.id}
            className="rounded border border-concrete-200 bg-concrete-50 px-2 py-1 text-xs text-concrete-700"
          >
            {unit.name}
            {unit.unitType ? ` · ${unit.unitType}` : ""}
          </span>
        ))}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (newUnitName.trim()) addUnit.mutate();
          }}
          className="flex items-center gap-1"
        >
          <input
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="Unit name"
            className="w-28 rounded border border-concrete-200 px-2 py-1 text-xs focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
          <button
            type="submit"
            disabled={addUnit.isPending}
            className="rounded border border-concrete-200 px-2 py-1 text-xs text-concrete-700 hover:bg-concrete-50 disabled:opacity-60"
          >
            + Unit
          </button>
        </form>
      </div>
    </div>
  );
}
