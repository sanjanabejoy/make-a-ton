import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import http from '../../../api/http';
import { useAuth } from '../../../auth/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Drawer from '../../../components/ui/Drawer';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import FilterBar from '../../../components/ui/FilterBar';
import SearchInput from '../../../components/ui/SearchInput';
import Badge from '../../../components/ui/Badge';

export function CrudPage({
  title,
  description,
  entityName,
  endpoint,
  queryKey,
  columns = [],
  renderForm,
  defaultValues = {},
  validateForm,
  adminOnlyWrite = true,
  searchPlaceholder = 'Search...',
  filterFn,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const isReadOnly = adminOnlyWrite && user?.role !== 'admin';

  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(defaultValues);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch list
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await http.get(endpoint);
      return res.data || res;
    },
  });

  const list = Array.isArray(data) ? data : data?.data || [];

  // Filter list
  const filteredList = list.filter((item) => {
    if (filterFn) return filterFn(item, search);
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(s)
    );
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return await http.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${entityName} created successfully.`);
      closeDrawer();
    },
    onError: (err) => {
      toast.error(err.message || `Failed to create ${entityName}.`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return await http.put(`${endpoint}/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${entityName} updated successfully.`);
      closeDrawer();
    },
    onError: (err) => {
      toast.error(err.message || `Failed to update ${entityName}.`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await http.delete(`${endpoint}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${entityName} removed.`);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message || `Failed to delete ${entityName}.`);
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    setFormData(defaultValues);
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setFormErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingItem(null);
    setFormData(defaultValues);
    setFormErrors({});
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm) {
      const errors = validateForm(formData);
      if (errors && Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
    }
    setFormErrors({});

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Add row actions for Edit / Delete if not read-only
  const rowActions = isReadOnly
    ? null
    : (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setItemToDelete(row);
              setDeleteConfirmOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-rose-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex items-center gap-3">
            {isReadOnly ? (
              <Badge variant="amber" className="text-xs">
                Staff (Read-Only)
              </Badge>
            ) : (
              <Button variant="primary" onClick={openCreate} icon={Plus}>
                Add {entityName}
              </Button>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={searchPlaceholder}
        />
        <div className="text-xs text-slate-500 font-medium">
          {filteredList.length} {filteredList.length === 1 ? 'item' : 'items'}
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredList}
        total={filteredList.length}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        rowActions={rowActions}
        emptyTitle={`No ${entityName.toLowerCase()}s found`}
        emptyActionLabel={!isReadOnly ? `Create First ${entityName}` : undefined}
        onEmptyAction={!isReadOnly ? openCreate : undefined}
      />

      {/* Create / Edit Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={editingItem ? `Edit ${entityName}` : `New ${entityName}`}
        description={
          editingItem
            ? `Modify configuration and parameters for ${editingItem.name || entityName}`
            : `Provide settings to configure a new ${entityName}`
        }
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="outline" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleFormSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : `Create ${entityName}`}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {renderForm &&
            renderForm({
              formData,
              setFormData,
              formErrors,
              setFormErrors,
              isEditing: !!editingItem,
            })}
        </form>
      </Drawer>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
        title={`Delete ${entityName}`}
        message={`Are you sure you want to delete "${itemToDelete?.name || 'this item'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default CrudPage;
