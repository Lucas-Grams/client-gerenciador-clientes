import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Cliente} from "../../../core/models/cliente.model";
import {ActivatedRoute} from "@angular/router";
import {Tag} from "../../../core/models/tag.model";
import {ClienteService} from "../../../core/services/clienteService";

import Swal from "sweetalert2";
import {TagService} from "../../../core/services/tagService";
import {ClienteTag} from "../../../core/models/cliente-tag.model";

@Component({
    selector: 'app-form-clients',
    templateUrl: 'form-clients.component.html',
    styleUrls: ['form-clients.component.css']
})
export class FormClientsComponent implements OnInit {

    loading: boolean = false;
    formInvalid = false;

    formGroup: FormGroup = new FormGroup({});
    cliente: Cliente = new Cliente();
    tags: Tag[] = [];

    @Input() option?: number;
    @Input() uuid?: string;

    @Output() optionChange = new EventEmitter<number>();
    @Output() uuidChange = new EventEmitter<string>();

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private clienteService: ClienteService,
        private tagService: TagService
    ) {
    }


    ngOnInit() {
        this.buildForm();
        this.loadAll();
    }

    loadAll() {
        this.loading = true;
        if (this.uuid) {
            this.clienteService.getCliente(this.uuid).subscribe((response) => {
                if (response.status === "SUCCESS") {
                    this.cliente = response.data;
                    console.log(this.cliente);
                    this.formGroup.patchValue(this.cliente);
                }
            });
        }

        this.tagService.getTags().subscribe((response) => {
            if (response.status === "SUCCESS") {
                response.data.forEach((tag: Tag) => {
                    tag.ativo ? this.tags.push(tag) : null;
                });
            }
        });
        this.loading = false;
    }

    buildForm() {
        this.formGroup = this.formBuilder.group({
            nome: this.formBuilder.control(this.cliente.nome, [Validators.required, Validators.max(100),
                Validators.min(3)]),
            id: this.formBuilder.control(this.cliente.id, []),
            uuid: this.formBuilder.control(this.cliente.uuid, []),
            email: this.formBuilder.control(this.cliente.email, [Validators.required, Validators.email]),
            clienteTags: this.formBuilder.control(this.cliente.clienteTags, []),
            altivo: this.formBuilder.control(this.cliente.ativo, [])
        });
        this.loading = false;
    }

    checkTag(tag: Tag): boolean {
        return this.cliente.clienteTags.some(clienteTag => clienteTag.tagId === tag.id);
    }


    addTag(tag: Tag): void {
        if (!this.checkTag(tag)) {
            let clienteTag = new ClienteTag(tag.id, this.cliente.id);
            this.cliente.clienteTags.push(clienteTag);
        } else {
            let i = this.cliente.clienteTags.findIndex((clienteTag: ClienteTag) => clienteTag.tagId === tag.id);
            if (i !== -1) {
                this.cliente.clienteTags.splice(i, 1);

            }
        }
    }


    salvar() {
        this.formGroup.get('clienteTags')?.setValue(this.cliente.clienteTags);
        if (this.formGroup.valid) {
            this.cliente = this.formGroup.getRawValue();
            this.clienteService.postCliente(this.cliente).subscribe(
                (response) => {
                    Swal.fire('Sucesso', `Cliente ${this.cliente.id ? 'atualizado' : 'cadastrado'} com sucesso`, 'success');
                    this.formGroup.reset();
                    this.formGroup.markAsUntouched();
                    this.uuidChange.emit(undefined);
                    this.optionChange.emit(1);
                },
                (error) => {
                    console.log(error);
                    Swal.fire('Erro', 'Ocorreu um erro ao cadastrar o cliente, tente novamente ou contate o suporte!', 'error');
                },
                () => {
                }
            );
        } else {
            this.formInvalid = true;
            setTimeout(() => {
                this.formInvalid = false;
            }, 3000);
            return
        }
    }

}