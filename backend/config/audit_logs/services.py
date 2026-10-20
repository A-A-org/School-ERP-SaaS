from .models import AuditLog



def log_action(
    user,
    action,
    module,
    description,
    obj=None,
    old_data=None,
    new_data=None
):

    AuditLog.objects.create(

        user=user,

        action=action,

        module=module,

        object_id=(
            obj.id
            if obj
            else None
        ),

        description=description,

        old_data=old_data,

        new_data=new_data

    )



def log_create(
    user,
    module,
    obj
):

    log_action(

        user=user,

        action="CREATE",

        module=module,

        description=(
            f"Created {module} "
            f"ID {obj.id}"
        ),

        obj=obj

    )



def log_update(
    user,
    module,
    obj,
    old_data,
    new_data
):

    log_action(

        user=user,

        action="UPDATE",

        module=module,

        description=(
            f"Updated {module} "
            f"ID {obj.id}"
        ),

        obj=obj,

        old_data=old_data,

        new_data=new_data

    )



def log_delete(
    user,
    module,
    obj,
    old_data=None
):

    log_action(

        user=user,

        action="DELETE",

        module=module,

        description=(
            f"Deleted {module} "
            f"ID {obj.id}"
        ),

        obj=obj,

        old_data=old_data

    )